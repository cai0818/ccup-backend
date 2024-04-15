import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblTransaction extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    block_height: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    transaction_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false
    },
    from_account: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    to_account: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      comment: "1: token 2: nft"
    },
    nft_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'tbl_transactions',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_transactions_from_account_index",
        fields: [
          { name: "from_account" },
        ]
      },
      {
        name: "tbl_transactions_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "tbl_transactions_to_account_index",
        fields: [
          { name: "to_account" },
        ]
      },
      {
        name: "tbl_transactions_transaction_hash_index",
        fields: [
          { name: "transaction_hash" },
        ]
      },
    ]
  });
  }
}
