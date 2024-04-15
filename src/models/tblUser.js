import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblUser extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    verified: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1
    },
    company_uscc: {
      type: DataTypes.CHAR(18),
      allowNull: true
    },
    company_phone: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    annual_quota: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 100000
    }
  }, {
    sequelize,
    tableName: 'tbl_users',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_users_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
