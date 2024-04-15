import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblReportTemplate extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    display_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    field_data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    additional_file_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbl_report_templates',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_report_templates_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
