/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface P2PIXInterface extends utils.Interface {
  functions: {
    "_castAddrToKey(address)": FunctionFragment;
    "cancelDeposit(uint256)": FunctionFragment;
    "defaultLockBlocks()": FunctionFragment;
    "deposit(address,uint256,string)": FunctionFragment;
    "depositCount()": FunctionFragment;
    "lock(uint256,address,address,uint256,uint256,bytes32[])": FunctionFragment;
    "mapDeposits(uint256)": FunctionFragment;
    "mapLocks(bytes32)": FunctionFragment;
    "owner()": FunctionFragment;
    "release(bytes32,uint256,bytes32,bytes32,uint8)": FunctionFragment;
    "setOwner(address)": FunctionFragment;
    "unlockExpired(bytes32[])": FunctionFragment;
    "validBacenSigners(uint256)": FunctionFragment;
    "withdraw(uint256,bytes32[])": FunctionFragment;
    "withdrawPremiums()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "_castAddrToKey"
      | "cancelDeposit"
      | "defaultLockBlocks"
      | "deposit"
      | "depositCount"
      | "lock"
      | "mapDeposits"
      | "mapLocks"
      | "owner"
      | "release"
      | "setOwner"
      | "unlockExpired"
      | "validBacenSigners"
      | "withdraw"
      | "withdrawPremiums"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "_castAddrToKey",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelDeposit",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "defaultLockBlocks",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "depositCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "lock",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "mapDeposits",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "mapLocks",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "release",
    values: [
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "setOwner",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "unlockExpired",
    values: [PromiseOrValue<BytesLike>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "validBacenSigners",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BytesLike>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawPremiums",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "_castAddrToKey",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cancelDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "defaultLockBlocks",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "depositCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "lock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "mapDeposits",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "mapLocks", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "release", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setOwner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "unlockExpired",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "validBacenSigners",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawPremiums",
    data: BytesLike
  ): Result;

  events: {
    "DepositAdded(address,uint256,address,uint256,uint256)": EventFragment;
    "DepositClosed(address,uint256)": EventFragment;
    "DepositWithdrawn(address,uint256,uint256)": EventFragment;
    "LockAdded(address,bytes32,uint256,uint256)": EventFragment;
    "LockReleased(address,bytes32)": EventFragment;
    "LockReturned(address,bytes32)": EventFragment;
    "OwnerUpdated(address,address)": EventFragment;
    "PremiumsWithdrawn(address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "DepositAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositClosed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositWithdrawn"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockReleased"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockReturned"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnerUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PremiumsWithdrawn"): EventFragment;
}

export interface DepositAddedEventObject {
  seller: string;
  depositID: BigNumber;
  token: string;
  premium: BigNumber;
  amount: BigNumber;
}
export type DepositAddedEvent = TypedEvent<
  [string, BigNumber, string, BigNumber, BigNumber],
  DepositAddedEventObject
>;

export type DepositAddedEventFilter = TypedEventFilter<DepositAddedEvent>;

export interface DepositClosedEventObject {
  seller: string;
  depositID: BigNumber;
}
export type DepositClosedEvent = TypedEvent<
  [string, BigNumber],
  DepositClosedEventObject
>;

export type DepositClosedEventFilter = TypedEventFilter<DepositClosedEvent>;

export interface DepositWithdrawnEventObject {
  seller: string;
  depositID: BigNumber;
  amount: BigNumber;
}
export type DepositWithdrawnEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  DepositWithdrawnEventObject
>;

export type DepositWithdrawnEventFilter =
  TypedEventFilter<DepositWithdrawnEvent>;

export interface LockAddedEventObject {
  buyer: string;
  lockID: string;
  depositID: BigNumber;
  amount: BigNumber;
}
export type LockAddedEvent = TypedEvent<
  [string, string, BigNumber, BigNumber],
  LockAddedEventObject
>;

export type LockAddedEventFilter = TypedEventFilter<LockAddedEvent>;

export interface LockReleasedEventObject {
  buyer: string;
  lockId: string;
}
export type LockReleasedEvent = TypedEvent<
  [string, string],
  LockReleasedEventObject
>;

export type LockReleasedEventFilter = TypedEventFilter<LockReleasedEvent>;

export interface LockReturnedEventObject {
  buyer: string;
  lockId: string;
}
export type LockReturnedEvent = TypedEvent<
  [string, string],
  LockReturnedEventObject
>;

export type LockReturnedEventFilter = TypedEventFilter<LockReturnedEvent>;

export interface OwnerUpdatedEventObject {
  user: string;
  newOwner: string;
}
export type OwnerUpdatedEvent = TypedEvent<
  [string, string],
  OwnerUpdatedEventObject
>;

export type OwnerUpdatedEventFilter = TypedEventFilter<OwnerUpdatedEvent>;

export interface PremiumsWithdrawnEventObject {
  owner: string;
  amount: BigNumber;
}
export type PremiumsWithdrawnEvent = TypedEvent<
  [string, BigNumber],
  PremiumsWithdrawnEventObject
>;

export type PremiumsWithdrawnEventFilter =
  TypedEventFilter<PremiumsWithdrawnEvent>;

export interface P2PIX extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: P2PIXInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    _castAddrToKey(
      _addr: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { _key: BigNumber }>;

    cancelDeposit(
      depositID: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<[BigNumber]>;

    deposit(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      pixTarget: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    depositCount(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { _val: BigNumber }>;

    lock(
      _depositID: PromiseOrValue<BigNumberish>,
      _targetAddress: PromiseOrValue<string>,
      _relayerAddress: PromiseOrValue<string>,
      _relayerPremium: PromiseOrValue<BigNumberish>,
      _amount: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    mapDeposits(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, string, string, boolean] & {
        remaining: BigNumber;
        premium: BigNumber;
        pixTarget: string;
        seller: string;
        token: string;
        valid: boolean;
      }
    >;

    mapLocks(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, BigNumber, string, string] & {
        depositID: BigNumber;
        relayerPremium: BigNumber;
        amount: BigNumber;
        expirationBlock: BigNumber;
        targetAddress: string;
        relayerAddress: string;
      }
    >;

    owner(overrides?: CallOverrides): Promise<[string]>;

    release(
      lockID: PromiseOrValue<BytesLike>,
      pixTimestamp: PromiseOrValue<BigNumberish>,
      r: PromiseOrValue<BytesLike>,
      s: PromiseOrValue<BytesLike>,
      v: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    unlockExpired(
      lockIDs: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    validBacenSigners(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    withdraw(
      depositID: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawPremiums(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  _castAddrToKey(
    _addr: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  cancelDeposit(
    depositID: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

  deposit(
    token: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    pixTarget: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  depositCount(overrides?: CallOverrides): Promise<BigNumber>;

  lock(
    _depositID: PromiseOrValue<BigNumberish>,
    _targetAddress: PromiseOrValue<string>,
    _relayerAddress: PromiseOrValue<string>,
    _relayerPremium: PromiseOrValue<BigNumberish>,
    _amount: PromiseOrValue<BigNumberish>,
    expiredLocks: PromiseOrValue<BytesLike>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  mapDeposits(
    arg0: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, string, string, string, boolean] & {
      remaining: BigNumber;
      premium: BigNumber;
      pixTarget: string;
      seller: string;
      token: string;
      valid: boolean;
    }
  >;

  mapLocks(
    arg0: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber, BigNumber, string, string] & {
      depositID: BigNumber;
      relayerPremium: BigNumber;
      amount: BigNumber;
      expirationBlock: BigNumber;
      targetAddress: string;
      relayerAddress: string;
    }
  >;

  owner(overrides?: CallOverrides): Promise<string>;

  release(
    lockID: PromiseOrValue<BytesLike>,
    pixTimestamp: PromiseOrValue<BigNumberish>,
    r: PromiseOrValue<BytesLike>,
    s: PromiseOrValue<BytesLike>,
    v: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setOwner(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  unlockExpired(
    lockIDs: PromiseOrValue<BytesLike>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  validBacenSigners(
    arg0: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  withdraw(
    depositID: PromiseOrValue<BigNumberish>,
    expiredLocks: PromiseOrValue<BytesLike>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawPremiums(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    _castAddrToKey(
      _addr: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    cancelDeposit(
      depositID: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

    deposit(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      pixTarget: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    depositCount(overrides?: CallOverrides): Promise<BigNumber>;

    lock(
      _depositID: PromiseOrValue<BigNumberish>,
      _targetAddress: PromiseOrValue<string>,
      _relayerAddress: PromiseOrValue<string>,
      _relayerPremium: PromiseOrValue<BigNumberish>,
      _amount: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<string>;

    mapDeposits(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, string, string, boolean] & {
        remaining: BigNumber;
        premium: BigNumber;
        pixTarget: string;
        seller: string;
        token: string;
        valid: boolean;
      }
    >;

    mapLocks(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, BigNumber, string, string] & {
        depositID: BigNumber;
        relayerPremium: BigNumber;
        amount: BigNumber;
        expirationBlock: BigNumber;
        targetAddress: string;
        relayerAddress: string;
      }
    >;

    owner(overrides?: CallOverrides): Promise<string>;

    release(
      lockID: PromiseOrValue<BytesLike>,
      pixTimestamp: PromiseOrValue<BigNumberish>,
      r: PromiseOrValue<BytesLike>,
      s: PromiseOrValue<BytesLike>,
      v: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    unlockExpired(
      lockIDs: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<void>;

    validBacenSigners(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    withdraw(
      depositID: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawPremiums(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "DepositAdded(address,uint256,address,uint256,uint256)"(
      seller?: PromiseOrValue<string> | null,
      depositID?: null,
      token?: null,
      premium?: null,
      amount?: null
    ): DepositAddedEventFilter;
    DepositAdded(
      seller?: PromiseOrValue<string> | null,
      depositID?: null,
      token?: null,
      premium?: null,
      amount?: null
    ): DepositAddedEventFilter;

    "DepositClosed(address,uint256)"(
      seller?: PromiseOrValue<string> | null,
      depositID?: null
    ): DepositClosedEventFilter;
    DepositClosed(
      seller?: PromiseOrValue<string> | null,
      depositID?: null
    ): DepositClosedEventFilter;

    "DepositWithdrawn(address,uint256,uint256)"(
      seller?: PromiseOrValue<string> | null,
      depositID?: null,
      amount?: null
    ): DepositWithdrawnEventFilter;
    DepositWithdrawn(
      seller?: PromiseOrValue<string> | null,
      depositID?: null,
      amount?: null
    ): DepositWithdrawnEventFilter;

    "LockAdded(address,bytes32,uint256,uint256)"(
      buyer?: PromiseOrValue<string> | null,
      lockID?: PromiseOrValue<BytesLike> | null,
      depositID?: null,
      amount?: null
    ): LockAddedEventFilter;
    LockAdded(
      buyer?: PromiseOrValue<string> | null,
      lockID?: PromiseOrValue<BytesLike> | null,
      depositID?: null,
      amount?: null
    ): LockAddedEventFilter;

    "LockReleased(address,bytes32)"(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null
    ): LockReleasedEventFilter;
    LockReleased(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null
    ): LockReleasedEventFilter;

    "LockReturned(address,bytes32)"(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null
    ): LockReturnedEventFilter;
    LockReturned(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null
    ): LockReturnedEventFilter;

    "OwnerUpdated(address,address)"(
      user?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnerUpdatedEventFilter;
    OwnerUpdated(
      user?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnerUpdatedEventFilter;

    "PremiumsWithdrawn(address,uint256)"(
      owner?: null,
      amount?: null
    ): PremiumsWithdrawnEventFilter;
    PremiumsWithdrawn(
      owner?: null,
      amount?: null
    ): PremiumsWithdrawnEventFilter;
  };

  estimateGas: {
    _castAddrToKey(
      _addr: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    cancelDeposit(
      depositID: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

    deposit(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      pixTarget: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    depositCount(overrides?: CallOverrides): Promise<BigNumber>;

    lock(
      _depositID: PromiseOrValue<BigNumberish>,
      _targetAddress: PromiseOrValue<string>,
      _relayerAddress: PromiseOrValue<string>,
      _relayerPremium: PromiseOrValue<BigNumberish>,
      _amount: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    mapDeposits(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    mapLocks(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    release(
      lockID: PromiseOrValue<BytesLike>,
      pixTimestamp: PromiseOrValue<BigNumberish>,
      r: PromiseOrValue<BytesLike>,
      s: PromiseOrValue<BytesLike>,
      v: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    unlockExpired(
      lockIDs: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    validBacenSigners(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(
      depositID: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawPremiums(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    _castAddrToKey(
      _addr: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    cancelDeposit(
      depositID: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    deposit(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      pixTarget: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    depositCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    lock(
      _depositID: PromiseOrValue<BigNumberish>,
      _targetAddress: PromiseOrValue<string>,
      _relayerAddress: PromiseOrValue<string>,
      _relayerPremium: PromiseOrValue<BigNumberish>,
      _amount: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    mapDeposits(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    mapLocks(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    release(
      lockID: PromiseOrValue<BytesLike>,
      pixTimestamp: PromiseOrValue<BigNumberish>,
      r: PromiseOrValue<BytesLike>,
      s: PromiseOrValue<BytesLike>,
      v: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    unlockExpired(
      lockIDs: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    validBacenSigners(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      depositID: PromiseOrValue<BigNumberish>,
      expiredLocks: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawPremiums(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
