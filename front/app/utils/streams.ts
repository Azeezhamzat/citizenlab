import { Observer, Observable, Subscription } from 'rxjs';
import {
  startWith,
  scan,
  filter,
  distinctUntilChanged,
  refCount,
  publishReplay,
} from 'rxjs/operators';
import {
  includes,
  flatten,
  forOwn,
  isArray,
  isString,
  isObject,
  isEmpty,
  isFunction,
  cloneDeep,
  has,
  omit,
  forEach,
  union,
  uniq,
  isUndefined,
} from 'lodash-es';
import request from 'utils/request';
import { authApiEndpoint } from 'services/auth';
import { currentAppConfigurationEndpoint } from 'services/appConfiguration';
import { currentOnboardingCampaignsApiEndpoint } from 'services/onboardingCampaigns';
import stringify from 'json-stable-stringify';
import { reportError } from 'utils/loggingUtils';
import { isUUID } from 'utils/helperUtils';
import modules from 'modules';

export type pureFn<T> = (arg: T) => T;
type fetchFn = () => Promise<any>;
interface IObject {
  [key: string]: any;
}
export type IObserver<T> = Observer<T | pureFn<T> | null>;
export interface IStreamParams {
  bodyData?: IObject | null;
  queryParameters?: IObject | null;
  cacheStream?: boolean;
  skipSanitizationFor?: string[];
}
export interface IInputStreamParams extends IStreamParams {
  apiEndpoint: string;
}
interface IExtendedStreamParams {
  apiEndpoint: string;
  cacheStream?: boolean;
  bodyData: IObject | null;
  queryParameters: IObject | null;
}
export interface IStream<T> {
  params: IExtendedStreamParams;
  streamId: string;
  isQueryStream: boolean;
  isSearchQuery: boolean;
  isSingleItemStream: boolean;
  cacheStream?: boolean;
  type: 'singleObject' | 'arrayOfObjects' | 'unknown';
  fetch: fetchFn;
  observer: IObserver<T>;
  observable: Observable<T>;
  subscription?: Subscription;
  dataIds: { [key: string]: true };
}

class Streams {
  public streams: { [key: string]: IStream<any> };
  public resourcesByDataId: { [key: string]: any };
  public streamIdsByApiEndPointWithQuery: { [key: string]: string[] };
  public streamIdsByApiEndPointWithoutQuery: { [key: string]: string[] };
  public streamIdsByDataIdWithoutQuery: { [key: string]: string[] };
  public streamIdsByDataIdWithQuery: { [key: string]: string[] };

  // this.streams = collection of all streams that are initiated by endpoint requests to the back-end
  // this.resourcesByDataId = key-value object with keys being the unique data id's (e.g. idea.data.id) and values the data associated with those id's
  // this.streamIdsByApiEndPointWithQuery = key-value object that indexes all streams with query params by their api endpoint. key = api endpoint, value = the stream associated with this endpoint (included in this.streams)
  // this.streamIdsByApiEndPointWithoutQuery = same as streamIdsByApiEndPointWithQuery, but instead indexes streams that do not include query parameters
  // this.streamIdsByDataIdWithQuery = key-value object that indexes all streams with query params by their dataId(s). key = api endpoint, value = the stream associated with this endpoint (included in this.streams)
  // this.streamIdsByDataIdWithoutQuery = same as streamIdsByDataIdWithQuery, but instead indexes streams that do not include query parameters
  constructor() {
    this.streams = {};
    this.resourcesByDataId = {};
    this.streamIdsByApiEndPointWithQuery = {};
    this.streamIdsByApiEndPointWithoutQuery = {};
    this.streamIdsByDataIdWithoutQuery = {};
    this.streamIdsByDataIdWithQuery = {};
  }

  async reset() {
    this.resourcesByDataId = {};

    const promises: Promise<any>[] = [];
    const promisesToAwait: Promise<any>[] = [];

    // rootStreams are the streams that should always be refetched when a reset occurs, and for which their refetch
    // should be awaited before any others streams are refetched.
    // Currently the only 2 rootstreams are those for the authUser and appConfiguration endpoints
    const rootStreamIds = [authApiEndpoint, currentAppConfigurationEndpoint];

    rootStreamIds.forEach((rootStreamId) => {
      promisesToAwait.push(this.streams[rootStreamId].fetch());
    });

    // Here we loop through all streams that are currently in the browser memory.
    // Every stream in the browser memory will be either refetched or removed when reset() is executed,
    // with the exception of the rootstreams (authUser and appConfiguration) and the custom fields stream ('/users/custom_fields/schema'), which we ignore here.
    Object.keys(this.streams).forEach((streamId) => {
      // If it's a rootstream or the custom fields stream ('/users/custom_fields/schema') we ignore it.
      // The rootstreams are already included in promisesToAwait and therefore so already queued for refetch, so would be redundant to add them to the list of refetched streams here as well.
      // We also ignore the custom fields stream in order to fix a bug that could potentially freeze the browser when the custom fields stream would be refetched.
      if (
        !includes(rootStreamIds, streamId) &&
        !streamId.endsWith('/users/custom_fields/schema')
      ) {
        // If the stream is currently active (= being subscribed to by one or more components that are mounted when reset() gets called)
        // we inlcude the stream in the list of streams to refetch.
        // Otherwise we include the stream in the list of streams that will be removed, with the exception of the custom fields stream
        if (
          this.isActiveStream(streamId) ||
          modules?.streamsToReset?.includes(streamId)
        ) {
          promises.push(this.streams[streamId].fetch());
        } else {
          this.deleteStream(
            streamId,
            this.streams[streamId].params.apiEndpoint
          );
        }
      }
    });

    try {
      // first we await the refetch promises for the rootstreams
      await Promise.all(promisesToAwait);
      // afterwards we refetch the active streams as determined by the loop above -without- awaiting there promises as that would take up too much time and is not needed
      Promise.all(promises);
    } finally {
      // finally we return a true value. We use 'finally' here to not block the reset from completing when there are refetches that fail
      return true;
    }
  }

  // Here we recursively freeze each property in the object provied as the argument so that the return object is immutable (=read-only).
  // This is a safety mechanism we apply to all objects being put in the streams to make sure that any given stream can be simultaneously
  // subscribed to in different components with the guarantee that each component will receive the exact same data for that stream.
  // If the stream data would not be immutable, you could in theory overwrite it in one place and (unknowingly) affect the data in other places that subscribe to that stream as well.
  // By making the stream data immutable, you avoid this scenario.
  deepFreeze<T>(object: T): T {
    let frozenObject = object;

    if (frozenObject && !Object.isFrozen(frozenObject)) {
      let property;
      let propertyKey;

      frozenObject = Object.freeze(object);

      for (propertyKey in frozenObject) {
        if ((frozenObject as Object).hasOwnProperty(propertyKey)) {
          property = frozenObject[propertyKey];

          if (
            typeof property !== 'object' ||
            !(property instanceof Object) ||
            Object.isFrozen(property)
          ) {
            continue;
          }

          this.deepFreeze(property);
        }
      }
    }

    return frozenObject;
  }

  // Checks if a stream is subscribed to by one ore more currently mounted components.
  // To dermine this, we use the internal rxjs refCount property, which keeps track
  // of the subscribe count for any given stream.
  isActiveStream(streamId: string) {
    const refCount = cloneDeep(
      this.streams[streamId].observable.source['_refCount']
    );
    const isCacheStream = cloneDeep(this.streams[streamId].cacheStream);

    // If a stream is cached we keep at least 1 subscription to it open at all times, and therefore it will always have a refCount of at least 1.
    // Hence we have to check for a count larger than 1 to determine if the stream is actively being used.
    // None-cached streams on the other hand are not subscribed to by default and have a refCount of 0 when not actively used.
    if ((isCacheStream && refCount > 1) || (!isCacheStream && refCount > 0)) {
      return true;
    }

    return false;
  }

  // Completetly removes a stream from all indexes and from browser memory
  // We call this function in 2 places:
  // - Whenever a reset occurs (streams.reset()) -> here we destroy the streams so it can be re-initiated after a user has logged in or out
  // - When a fetch inside of streams.get() returns an error -> here we destroy the stream so it can be re-initiated
  deleteStream(streamId: string, apiEndpoint: string) {
    if (includes(this.streamIdsByApiEndPointWithQuery[apiEndpoint], streamId)) {
      this.streamIdsByApiEndPointWithQuery[
        apiEndpoint
      ] = this.streamIdsByApiEndPointWithQuery[apiEndpoint].filter((value) => {
        return value !== streamId;
      });
    }

    if (
      includes(this.streamIdsByApiEndPointWithoutQuery[apiEndpoint], streamId)
    ) {
      this.streamIdsByApiEndPointWithoutQuery[
        apiEndpoint
      ] = this.streamIdsByApiEndPointWithoutQuery[apiEndpoint].filter(
        (value) => {
          return value !== streamId;
        }
      );
    }

    if (streamId && this.streams[streamId]) {
      Object.keys(this.streams[streamId].dataIds).forEach((dataId) => {
        if (includes(this.streamIdsByDataIdWithQuery[dataId], streamId)) {
          this.streamIdsByDataIdWithQuery[
            dataId
          ] = this.streamIdsByDataIdWithQuery[dataId].filter((value) => {
            return value !== streamId;
          });
        }

        if (includes(this.streamIdsByDataIdWithoutQuery[dataId], streamId)) {
          this.streamIdsByDataIdWithoutQuery[
            dataId
          ] = this.streamIdsByDataIdWithoutQuery[dataId].filter((value) => {
            return value !== streamId;
          });
        }
      });
    }

    if (this.streams[streamId] && this.streams[streamId].subscription) {
      (this.streams[streamId].subscription as Subscription).unsubscribe();
    }

    delete this.streams[streamId];
  }

  // Here we sanitize endpoints with query parameters
  // to normalize them (e.g. make sure any null, undefined or '' params do not get taken into account when determining if a stream for the given parans already exists).
  // The 'skipSanitizationFor' parameter can be used to provide a list of query parameter names that should not be sanitized
  sanitizeQueryParameters = (
    queryParameters: IObject | null,
    skipSanitizationFor?: string[]
  ) => {
    const sanitizedQueryParameters = cloneDeep(queryParameters);

    forOwn(queryParameters, (value, key) => {
      if (
        !skipSanitizationFor?.includes(key) &&
        (isUndefined(value) ||
          (isString(value) && isEmpty(value)) ||
          (isArray(value) && isEmpty(value)) ||
          (isObject(value) && isEmpty(value)))
      ) {
        delete (sanitizedQueryParameters as IObject)[key];
      }
    });

    return isObject(sanitizedQueryParameters) &&
      !isEmpty(sanitizedQueryParameters)
      ? sanitizedQueryParameters
      : null;
  };

  // Determines wether the stream is associated with an endpoint that return a single object (e.g. an idea endpoint)
  // or an endpoint that returns a collection of objects (e.g. the ideas endpoint)
  isSingleItemStream(lastUrlSegment: string, isQueryStream: boolean) {
    if (!isQueryStream) {
      // When the endpoint url ends with a UUID we're dealing with a single-item endpoint
      return isUUID(lastUrlSegment);
    }

    return false;
  }

  // Remove trailing slash to normalize the api endpoint names.
  // This is needed to avoid the creation of redundant streams for the same endpint (e.g. when providing the endpoint both with and without trailing slash)
  removeTrailingSlash(apiEndpoint: string) {
    return apiEndpoint.replace(/\/$/, '');
  }

  // The streamId is the unique identifier for a stream, and is composed by the following data:
  // - The api endpoint
  // - An optional cache parameter set to false when the stream is not cached (not included when cacheStream is true)
  // - Normalized and stringified query parameters (if any are present)
  // Together these parameters will return a streamId in the form of a string.
  getStreamId(
    apiEndpoint: string,
    isQueryStream: boolean,
    queryParameters: IObject | null,
    cacheStream: boolean
  ) {
    let streamId = apiEndpoint;

    if (!cacheStream) {
      streamId = `${streamId}?cached=${cacheStream}`;
    }

    if (queryParameters !== null && isQueryStream) {
      streamId = `${streamId}&${stringify(queryParameters)}`;
    }

    return streamId;
  }

  // addStreamIdByDataIdIndex will index a given streamId by the dataId(s) it includes.
  // This may sound a bit complicated, but it's actually rather simple:
  // Any given stream will have 1) a streamId and 2) one or more dataIds inside of it
  // The streamId is a unique identifier (see getStreamId()) for any given stream
  // The dataId or dataIds are the identifiers of the object(s) inside of a stream
  // E.g. You have a stream for the '/ideas' endpoint (without query params to make it a bit simpler).
  // This stream has a streamId of value '/ideas', and includes 2 idea objects. Each of these object has a data.id attribute (which is the unique identifier as returned by the back-end).
  // For the sake of the example: the first object has an id of '123' and the second object a dataId of '456'.
  // So we know that the stream with streamId '/ideas' has 2 objects in it. We also know the stream does not contain any query parameters.
  // With this knowledge we can now index this stream by its dataIds, e.g: this.streamIdsByDataIdWithoutQuery['123'] = ['/ideas'] and this.streamIdsByDataIdWithoutQuery['465'] = ['/ideas'].
  // Now that we have this indexes we can later determine which streams to update when either the data with id '123' or '456' changes.
  // E.g. when we know an update to dataId '123' occurs we can loop through all streams that contain this id, refetch their endpoints and push the new, updated data for '123' in the streams.
  // Alternatively we can also manually push the updated objects into all streams that contain this dataId (only applies to streams without query params, as to not mess up any sorting, pagination, etc... that might take place in streams with query params).
  addStreamIdByDataIdIndex(
    streamId: string,
    isQueryStream: boolean,
    dataId: string
  ) {
    if (isQueryStream) {
      if (
        this.streamIdsByDataIdWithQuery[dataId] &&
        !includes(this.streamIdsByDataIdWithQuery[dataId], streamId)
      ) {
        this.streamIdsByDataIdWithQuery[dataId].push(streamId);
      } else if (!this.streamIdsByDataIdWithQuery[dataId]) {
        this.streamIdsByDataIdWithQuery[dataId] = [streamId];
      }
    }

    if (!isQueryStream) {
      if (
        this.streamIdsByDataIdWithoutQuery[dataId] &&
        !includes(this.streamIdsByDataIdWithoutQuery[dataId], streamId)
      ) {
        this.streamIdsByDataIdWithoutQuery[dataId].push(streamId);
      } else if (!this.streamIdsByDataIdWithoutQuery[dataId]) {
        this.streamIdsByDataIdWithoutQuery[dataId] = [streamId];
      }
    }
  }

  // same concept as addStreamIdByDataIdIndex, but instead of indexing by dataId we index here by apiEndpoint
  // Why index by both dataId and apiEndpoint?
  addStreamIdByApiEndpointIndex(
    apiEndpoint: string,
    streamId: string,
    isQueryStream: boolean
  ) {
    if (isQueryStream) {
      if (!this.streamIdsByApiEndPointWithQuery[apiEndpoint]) {
        this.streamIdsByApiEndPointWithQuery[apiEndpoint] = [streamId];
      } else {
        this.streamIdsByApiEndPointWithQuery[apiEndpoint].push(streamId);
      }
    }

    if (!isQueryStream) {
      if (!this.streamIdsByApiEndPointWithoutQuery[apiEndpoint]) {
        this.streamIdsByApiEndPointWithoutQuery[apiEndpoint] = [streamId];
      } else {
        this.streamIdsByApiEndPointWithoutQuery[apiEndpoint].push(streamId);
      }
    }
  }

  get<T>(inputParams: IInputStreamParams) {
    const params: IExtendedStreamParams = {
      bodyData: null,
      queryParameters: null,
      ...inputParams,
    };
    const apiEndpoint = this.removeTrailingSlash(params.apiEndpoint);
    const queryParameters = this.sanitizeQueryParameters(
      params.queryParameters,
      inputParams.skipSanitizationFor
    );
    const isQueryStream =
      isObject(queryParameters) && !isEmpty(queryParameters);
    const isSearchQuery =
      isQueryStream &&
      queryParameters &&
      queryParameters['search'] &&
      isString(queryParameters['search']) &&
      !isEmpty(queryParameters['search']);
    const cacheStream =
      isSearchQuery || inputParams.cacheStream === false ? false : true;
    const streamId = this.getStreamId(
      apiEndpoint,
      isQueryStream,
      queryParameters,
      cacheStream
    );

    if (!has(this.streams, streamId)) {
      const { bodyData } = params;
      const lastUrlSegment = apiEndpoint.substr(
        apiEndpoint.lastIndexOf('/') + 1
      );
      const isSingleItemStream = this.isSingleItemStream(
        lastUrlSegment,
        isQueryStream
      );
      const observer: IObserver<T | null> = null as any;

      const fetch = () => {
        return request<any>(
          apiEndpoint,
          bodyData,
          { method: 'GET' },
          queryParameters
        )
          .then((response) => {
            this.streams?.[streamId]?.observer?.next(response);
            return response;
          })
          .catch((error) => {
            if (
              streamId !== authApiEndpoint &&
              streamId !== currentOnboardingCampaignsApiEndpoint
            ) {
              this.streams[streamId].observer.next(error);
              this.deleteStream(streamId, apiEndpoint);
              reportError(error);
              throw error;
            } else if (streamId === authApiEndpoint) {
              this.streams[streamId].observer.next(null);
            }

            return null;
          });
      };

      const observable = new Observable<T | null>((observer) => {
        const dataId = lastUrlSegment;

        if (this.streams[streamId]) {
          this.streams[streamId].observer = observer;
        }

        if (
          cacheStream &&
          isSingleItemStream &&
          has(this.resourcesByDataId, dataId)
        ) {
          observer.next(this.resourcesByDataId[dataId]);
        } else {
          fetch();
        }

        return () => {
          this.deleteStream(streamId, apiEndpoint);
        };
      }).pipe(
        startWith('initial' as any),
        scan((accumulated: T, current: T | pureFn<T>) => {
          let data: any = accumulated;
          const dataIds = {};

          this.streams[streamId].type = 'unknown';

          data = isFunction(current) ? current(data) : current;

          if (isObject(data) && !isEmpty(data)) {
            const innerData = data['data'];

            if (isArray(innerData)) {
              this.streams[streamId].type = 'arrayOfObjects';
              innerData
                .filter((item) => has(item, 'id'))
                .forEach((item) => {
                  const dataId = item.id;
                  dataIds[dataId] = true;
                  if (cacheStream) {
                    this.resourcesByDataId[dataId] = this.deepFreeze({
                      data: item,
                    });
                  }
                  this.addStreamIdByDataIdIndex(
                    streamId,
                    isQueryStream,
                    dataId
                  );
                });
            } else if (isObject(innerData) && has(innerData, 'id')) {
              const dataId = innerData['id'];
              this.streams[streamId].type = 'singleObject';
              dataIds[dataId] = true;
              if (cacheStream) {
                this.resourcesByDataId[dataId] = this.deepFreeze({
                  data: innerData,
                });
              }
              this.addStreamIdByDataIdIndex(streamId, isQueryStream, dataId);
            }

            if (has(data, 'included')) {
              data['included']
                .filter((item) => item.id)
                .forEach((item) => {
                  this.resourcesByDataId[item.id] = this.deepFreeze({
                    data: item,
                  });
                });

              data = omit(data, 'included');
            }
          }

          this.streams[streamId].dataIds = dataIds;

          return this.deepFreeze(data);
        }),
        filter((data) => data !== 'initial'),
        distinctUntilChanged(),
        publishReplay(1),
        refCount()
      );

      this.streams[streamId] = {
        params,
        fetch,
        observer,
        observable,
        streamId,
        isQueryStream,
        isSearchQuery,
        isSingleItemStream,
        cacheStream,
        type: 'unknown',
        dataIds: {},
      };

      this.addStreamIdByApiEndpointIndex(apiEndpoint, streamId, isQueryStream);

      if (cacheStream) {
        // keep stream hot
        this.streams[streamId].subscription = this.streams[
          streamId
        ].observable.subscribe();
      }

      return this.streams[streamId] as IStream<T>;
    }

    return this.streams[streamId] as IStream<T>;
  }

  async add<T>(
    unsafeApiEndpoint: string,
    bodyData: object | null,
    waitForRefetchesToResolve = false
  ) {
    const apiEndpoint = this.removeTrailingSlash(unsafeApiEndpoint);

    try {
      const promises: Promise<any>[] = [];
      const response = await request<T>(
        apiEndpoint,
        bodyData,
        { method: 'POST' },
        null
      );

      forEach(
        this.streamIdsByApiEndPointWithoutQuery[apiEndpoint],
        (streamId) => {
          const stream = this.streams[streamId];

          if (
            stream.cacheStream &&
            stream.type === 'singleObject' &&
            !isEmpty(response?.['data']) &&
            !isArray(response?.['data'])
          ) {
            stream.observer.next(this.deepFreeze(response));
          } else if (
            stream.cacheStream &&
            stream.type === 'arrayOfObjects' &&
            !isEmpty(response?.['data'])
          ) {
            stream.observer.next((previous) => {
              let data: any;

              if (isArray(response['data'])) {
                data = [...previous?.data, ...response['data']];
              } else {
                data = [...previous?.data, response['data']];
              }

              return this.deepFreeze({
                ...previous,
                data,
              });
            });
          } else {
            promises.push(stream.fetch());
          }
        }
      );

      forEach(this.streamIdsByApiEndPointWithQuery[apiEndpoint], (streamId) => {
        promises.push(this.streams[streamId].fetch());
      });

      if (waitForRefetchesToResolve) {
        await Promise.all(promises);
      }

      return response;
    } catch (error) {
      if (!error.json || !error.json.errors) {
        reportError(error);
      }
      return Promise.reject(error);
    }
  }

  async update<T>(
    unsafeApiEndpoint: string,
    dataId: string,
    bodyData: object,
    waitForRefetchesToResolve = false
  ) {
    const apiEndpoint = this.removeTrailingSlash(unsafeApiEndpoint);

    try {
      const promises: Promise<any>[] = [];
      const response = await request<T>(
        apiEndpoint,
        bodyData,
        { method: 'PATCH' },
        null
      );

      union(
        this.streamIdsByDataIdWithoutQuery[dataId],
        this.streamIdsByApiEndPointWithoutQuery[apiEndpoint]
      ).forEach((streamId) => {
        const stream = this.streams[streamId];
        const streamHasDataId = has(stream, `dataIds.${dataId}`);

        if (!stream.cacheStream) {
          promises.push(stream.fetch());
        } else if (streamHasDataId && stream.type === 'singleObject') {
          stream.observer.next(response);
        } else if (streamHasDataId && stream.type === 'arrayOfObjects') {
          stream.observer.next((previous) =>
            this.deepFreeze({
              ...previous,
              data: previous.data.map((child) =>
                child.id === dataId ? response['data'] : child
              ),
            })
          );
        }
      });

      union(
        this.streamIdsByApiEndPointWithQuery[apiEndpoint],
        this.streamIdsByDataIdWithQuery[dataId]
      ).forEach((streamId) => {
        promises.push(this.streams[streamId].fetch());
      });

      if (waitForRefetchesToResolve) {
        await Promise.all(promises);
      }

      return response;
    } catch (error) {
      if (!error.json || !error.json.errors) {
        reportError(error);
      }

      return Promise.reject(error);
    }
  }

  async delete(
    unsafeApiEndpoint: string,
    dataId: string,
    waitForRefetchesToResolve = false
  ) {
    const apiEndpoint = this.removeTrailingSlash(unsafeApiEndpoint);

    try {
      const promises: Promise<any>[] = [];

      await request(apiEndpoint, null, { method: 'DELETE' }, null);

      union(
        this.streamIdsByDataIdWithoutQuery[dataId],
        this.streamIdsByApiEndPointWithoutQuery[apiEndpoint]
      ).forEach((streamId) => {
        const stream = this.streams[streamId];
        const streamHasDataId = has(stream, `dataIds.${dataId}`);

        if (stream && !stream.cacheStream) {
          promises.push(stream.fetch());
        } else if (streamHasDataId && stream.type === 'singleObject') {
          stream.observer.next(undefined);
        } else if (streamHasDataId && stream.type === 'arrayOfObjects') {
          stream.observer.next((previous) =>
            this.deepFreeze({
              ...previous,
              data: previous.data.filter((child) => child.id !== dataId),
            })
          );
        }
      });

      union(
        this.streamIdsByApiEndPointWithQuery[apiEndpoint],
        this.streamIdsByDataIdWithQuery[dataId]
      ).forEach((streamId) => {
        promises.push(this.streams[streamId].fetch());
      });

      if (waitForRefetchesToResolve) {
        await Promise.all(promises);
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log(error);
      }

      if (!error.json || !error.json.errors) {
        reportError(error);
      }

      return Promise.reject(error);
    }
  }

  async fetchAllWith({
    dataId,
    apiEndpoint,
    partialApiEndpoint,
    regexApiEndpoint,
    onlyFetchActiveStreams,
  }: {
    dataId?: string[];
    apiEndpoint?: string[];
    partialApiEndpoint?: string[];
    regexApiEndpoint?: RegExp[];
    onlyFetchActiveStreams?: boolean;
  }) {
    const keys = [...(dataId || []), ...(apiEndpoint || [])];
    const promises: Promise<any>[] = [];

    const streamIds1 = flatten(
      keys.map((key) => [
        ...(this.streamIdsByDataIdWithQuery[key] || []),
        ...(this.streamIdsByDataIdWithoutQuery[key] || []),
        ...(this.streamIdsByApiEndPointWithQuery[key] || []),
        ...(this.streamIdsByApiEndPointWithoutQuery[key] || []),
      ])
    );

    const streamIds2: string[] = [];
    if (partialApiEndpoint && partialApiEndpoint.length > 0) {
      forOwn(this.streamIdsByApiEndPointWithQuery, (_value, key) => {
        partialApiEndpoint.forEach((endpoint) => {
          if (
            key.includes(endpoint) &&
            this.streamIdsByApiEndPointWithQuery[key]
          ) {
            streamIds2.push(...this.streamIdsByApiEndPointWithQuery[key]);
          }
        });
      });

      forOwn(this.streamIdsByApiEndPointWithoutQuery, (_value, key) => {
        partialApiEndpoint.forEach((endpoint) => {
          if (
            key.includes(endpoint) &&
            this.streamIdsByApiEndPointWithoutQuery[key]
          ) {
            streamIds2.push(...this.streamIdsByApiEndPointWithoutQuery[key]);
          }
        });
      });
    }

    const streamIds3: string[] = [];
    if (regexApiEndpoint && regexApiEndpoint.length > 0) {
      forOwn(this.streamIdsByApiEndPointWithQuery, (_value, key) => {
        regexApiEndpoint.forEach((regex) => {
          if (regex.test(key) && this.streamIdsByApiEndPointWithQuery[key]) {
            streamIds3.push(...this.streamIdsByApiEndPointWithQuery[key]);
          }
        });
      });

      forOwn(this.streamIdsByApiEndPointWithoutQuery, (_value, key) => {
        regexApiEndpoint.forEach((regex) => {
          if (regex.test(key) && this.streamIdsByApiEndPointWithoutQuery[key]) {
            streamIds3.push(...this.streamIdsByApiEndPointWithoutQuery[key]);
          }
        });
      });
    }

    const mergedStreamIds = [...streamIds1, ...streamIds2, ...streamIds3];

    if (includes(keys, authApiEndpoint)) {
      mergedStreamIds.push(authApiEndpoint);
    }

    uniq(mergedStreamIds).forEach((streamId) => {
      if (!onlyFetchActiveStreams || this.isActiveStream(streamId)) {
        promises.push(this.streams[streamId].fetch());
      }
    });

    return await Promise.all(promises);
  }
}

const streams = new Streams();
export default streams;
