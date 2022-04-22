import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {HistoricalBalance} from "./historicalBalance.model"

@Entity_()
export class Pool {
  constructor(props?: Partial<Pool>) {
    Object.assign(this, props)
  }

  /**
   * ID is Pool address
   */
  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  assetA!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  assetB!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  assetABalance!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  assetBBalance!: bigint

  @OneToMany_(() => HistoricalBalance, e => e.pool)
  historicalBalances!: HistoricalBalance[]
}
