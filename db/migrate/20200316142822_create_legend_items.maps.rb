# This migration comes from maps (originally 20200316134420)
class CreateLegendItems < ActiveRecord::Migration[6.0]
  def change
    create_table :maps_legend_items, id: :uuid do |t|
      t.references :layer, foreign_key: {to_table: :maps_layers}, index: true, type: :uuid, null: false
      t.jsonb :title_multiloc, null: false, default: {} 
      t.string :color, null: true
      t.integer :ordering, null: false
      t.timestamps
    end
  end
end
