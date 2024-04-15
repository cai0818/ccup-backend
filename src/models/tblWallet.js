import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblWallet extends Model {
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
      },
      unique: "tbl_wallets_pk_2"
    },
    wallet_address: {
      type: DataTypes.CHAR(40),
      allowNull: false,
      unique: "tbl_wallets_pk_3"
    }
  }, {
    sequelize,
    tableName: 'tbl_wallets',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_wallets_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "tbl_wallets_pk_2",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "tbl_wallets_pk_3",
        unique: true,
        fields: [
          { name: "wallet_address" },
        ]
      },
    ]
  });
  }
}
