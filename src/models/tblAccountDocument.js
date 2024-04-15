import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblAccountDocument extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    file_uuid: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    file_format: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    original_name: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbl_account_documents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_verify_documents_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
