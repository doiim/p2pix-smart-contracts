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

export interface OwnerSettingsInterface extends utils.Interface {
  functions: {
    "allowedERC20s(address)": FunctionFragment;
    "defaultLockBlocks()": FunctionFragment;
    "isTrustedForwarder(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "reputation()": FunctionFragment;
    "sellerAllowList(address)": FunctionFragment;
    "setDefaultLockBlocks(uint256)": FunctionFragment;
    "setOwner(address)": FunctionFragment;
    "setReputation(address)": FunctionFragment;
    "setTrustedFowarders(address[],bool[])": FunctionFragment;
    "setValidSigners(address[])": FunctionFragment;
    "tokenSettings(address[],bool[])": FunctionFragment;
    "validBacenSigners(uint256)": FunctionFragment;
    "withdrawBalance()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "allowedERC20s"
      | "defaultLockBlocks"
      | "isTrustedForwarder"
      | "owner"
      | "reputation"
      | "sellerAllowList"
      | "setDefaultLockBlocks"
      | "setOwner"
      | "setReputation"
      | "setTrustedFowarders"
      | "setValidSigners"
      | "tokenSettings"
      | "validBacenSigners"
      | "withdrawBalance"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "allowedERC20s",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "defaultLockBlocks",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isTrustedForwarder",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "reputation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "sellerAllowList",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setDefaultLockBlocks",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setOwner",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setReputation",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setTrustedFowarders",
    values: [PromiseOrValue<string>[], PromiseOrValue<boolean>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "setValidSigners",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenSettings",
    values: [PromiseOrValue<string>[], PromiseOrValue<boolean>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "validBacenSigners",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawBalance",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "allowedERC20s",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "defaultLockBlocks",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isTrustedForwarder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "reputation", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "sellerAllowList",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setDefaultLockBlocks",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setOwner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setReputation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTrustedFowarders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setValidSigners",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenSettings",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "validBacenSigners",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawBalance",
    data: BytesLike
  ): Result;

  events: {
    "AllowedERC20Updated(address,bool)": EventFragment;
    "DepositAdded(address,address,uint256)": EventFragment;
    "DepositWithdrawn(address,address,uint256)": EventFragment;
    "FundsWithdrawn(address,uint256)": EventFragment;
    "LockAdded(address,uint256,address,uint256)": EventFragment;
    "LockBlocksUpdated(uint256)": EventFragment;
    "LockReleased(address,uint256,uint256)": EventFragment;
    "LockReturned(address,uint256)": EventFragment;
    "OwnerUpdated(address,address)": EventFragment;
    "ReputationUpdated(address)": EventFragment;
    "RootUpdated(address,bytes32)": EventFragment;
    "TrustedForwarderUpdated(address,bool)": EventFragment;
    "ValidSet(address,address,bool)": EventFragment;
    "ValidSignersUpdated(address[])": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AllowedERC20Updated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "DepositWithdrawn"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FundsWithdrawn"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockBlocksUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockReleased"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LockReturned"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnerUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ReputationUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RootUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TrustedForwarderUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ValidSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ValidSignersUpdated"): EventFragment;
}

export interface AllowedERC20UpdatedEventObject {
  token: string;
  state: boolean;
}
export type AllowedERC20UpdatedEvent = TypedEvent<
  [string, boolean],
  AllowedERC20UpdatedEventObject
>;

export type AllowedERC20UpdatedEventFilter =
  TypedEventFilter<AllowedERC20UpdatedEvent>;

export interface DepositAddedEventObject {
  seller: string;
  token: string;
  amount: BigNumber;
}
export type DepositAddedEvent = TypedEvent<
  [string, string, BigNumber],
  DepositAddedEventObject
>;

export type DepositAddedEventFilter = TypedEventFilter<DepositAddedEvent>;

export interface DepositWithdrawnEventObject {
  seller: string;
  token: string;
  amount: BigNumber;
}
export type DepositWithdrawnEvent = TypedEvent<
  [string, string, BigNumber],
  DepositWithdrawnEventObject
>;

export type DepositWithdrawnEventFilter =
  TypedEventFilter<DepositWithdrawnEvent>;

export interface FundsWithdrawnEventObject {
  owner: string;
  amount: BigNumber;
}
export type FundsWithdrawnEvent = TypedEvent<
  [string, BigNumber],
  FundsWithdrawnEventObject
>;

export type FundsWithdrawnEventFilter = TypedEventFilter<FundsWithdrawnEvent>;

export interface LockAddedEventObject {
  buyer: string;
  lockID: BigNumber;
  seller: string;
  amount: BigNumber;
}
export type LockAddedEvent = TypedEvent<
  [string, BigNumber, string, BigNumber],
  LockAddedEventObject
>;

export type LockAddedEventFilter = TypedEventFilter<LockAddedEvent>;

export interface LockBlocksUpdatedEventObject {
  blocks: BigNumber;
}
export type LockBlocksUpdatedEvent = TypedEvent<
  [BigNumber],
  LockBlocksUpdatedEventObject
>;

export type LockBlocksUpdatedEventFilter =
  TypedEventFilter<LockBlocksUpdatedEvent>;

export interface LockReleasedEventObject {
  buyer: string;
  lockId: BigNumber;
  amount: BigNumber;
}
export type LockReleasedEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  LockReleasedEventObject
>;

export type LockReleasedEventFilter = TypedEventFilter<LockReleasedEvent>;

export interface LockReturnedEventObject {
  buyer: string;
  lockId: BigNumber;
}
export type LockReturnedEvent = TypedEvent<
  [string, BigNumber],
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

export interface ReputationUpdatedEventObject {
  reputation: string;
}
export type ReputationUpdatedEvent = TypedEvent<
  [string],
  ReputationUpdatedEventObject
>;

export type ReputationUpdatedEventFilter =
  TypedEventFilter<ReputationUpdatedEvent>;

export interface RootUpdatedEventObject {
  seller: string;
  merkleRoot: string;
}
export type RootUpdatedEvent = TypedEvent<
  [string, string],
  RootUpdatedEventObject
>;

export type RootUpdatedEventFilter = TypedEventFilter<RootUpdatedEvent>;

export interface TrustedForwarderUpdatedEventObject {
  forwarder: string;
  state: boolean;
}
export type TrustedForwarderUpdatedEvent = TypedEvent<
  [string, boolean],
  TrustedForwarderUpdatedEventObject
>;

export type TrustedForwarderUpdatedEventFilter =
  TypedEventFilter<TrustedForwarderUpdatedEvent>;

export interface ValidSetEventObject {
  seller: string;
  token: string;
  state: boolean;
}
export type ValidSetEvent = TypedEvent<
  [string, string, boolean],
  ValidSetEventObject
>;

export type ValidSetEventFilter = TypedEventFilter<ValidSetEvent>;

export interface ValidSignersUpdatedEventObject {
  signers: string[];
}
export type ValidSignersUpdatedEvent = TypedEvent<
  [string[]],
  ValidSignersUpdatedEventObject
>;

export type ValidSignersUpdatedEventFilter =
  TypedEventFilter<ValidSignersUpdatedEvent>;

export interface OwnerSettings extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: OwnerSettingsInterface;

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
    allowedERC20s(
      erc20: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean] & { state: boolean }>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<[BigNumber]>;

    isTrustedForwarder(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    reputation(overrides?: CallOverrides): Promise<[string]>;

    sellerAllowList(
      sellerKey: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string] & { root: string }>;

    setDefaultLockBlocks(
      _blocks: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setReputation(
      _reputation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setTrustedFowarders(
      forwarders: PromiseOrValue<string>[],
      states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setValidSigners(
      _validSigners: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    tokenSettings(
      _tokens: PromiseOrValue<string>[],
      _states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    validBacenSigners(
      signer: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[boolean] & { valid: boolean }>;

    withdrawBalance(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  allowedERC20s(
    erc20: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

  isTrustedForwarder(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  owner(overrides?: CallOverrides): Promise<string>;

  reputation(overrides?: CallOverrides): Promise<string>;

  sellerAllowList(
    sellerKey: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  setDefaultLockBlocks(
    _blocks: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setOwner(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setReputation(
    _reputation: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setTrustedFowarders(
    forwarders: PromiseOrValue<string>[],
    states: PromiseOrValue<boolean>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setValidSigners(
    _validSigners: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  tokenSettings(
    _tokens: PromiseOrValue<string>[],
    _states: PromiseOrValue<boolean>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  validBacenSigners(
    signer: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  withdrawBalance(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    allowedERC20s(
      erc20: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

    isTrustedForwarder(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    owner(overrides?: CallOverrides): Promise<string>;

    reputation(overrides?: CallOverrides): Promise<string>;

    sellerAllowList(
      sellerKey: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    setDefaultLockBlocks(
      _blocks: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setReputation(
      _reputation: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setTrustedFowarders(
      forwarders: PromiseOrValue<string>[],
      states: PromiseOrValue<boolean>[],
      overrides?: CallOverrides
    ): Promise<void>;

    setValidSigners(
      _validSigners: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    tokenSettings(
      _tokens: PromiseOrValue<string>[],
      _states: PromiseOrValue<boolean>[],
      overrides?: CallOverrides
    ): Promise<void>;

    validBacenSigners(
      signer: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    withdrawBalance(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "AllowedERC20Updated(address,bool)"(
      token?: PromiseOrValue<string> | null,
      state?: PromiseOrValue<boolean> | null
    ): AllowedERC20UpdatedEventFilter;
    AllowedERC20Updated(
      token?: PromiseOrValue<string> | null,
      state?: PromiseOrValue<boolean> | null
    ): AllowedERC20UpdatedEventFilter;

    "DepositAdded(address,address,uint256)"(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      amount?: null
    ): DepositAddedEventFilter;
    DepositAdded(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      amount?: null
    ): DepositAddedEventFilter;

    "DepositWithdrawn(address,address,uint256)"(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      amount?: null
    ): DepositWithdrawnEventFilter;
    DepositWithdrawn(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      amount?: null
    ): DepositWithdrawnEventFilter;

    "FundsWithdrawn(address,uint256)"(
      owner?: null,
      amount?: null
    ): FundsWithdrawnEventFilter;
    FundsWithdrawn(owner?: null, amount?: null): FundsWithdrawnEventFilter;

    "LockAdded(address,uint256,address,uint256)"(
      buyer?: PromiseOrValue<string> | null,
      lockID?: PromiseOrValue<BigNumberish> | null,
      seller?: null,
      amount?: null
    ): LockAddedEventFilter;
    LockAdded(
      buyer?: PromiseOrValue<string> | null,
      lockID?: PromiseOrValue<BigNumberish> | null,
      seller?: null,
      amount?: null
    ): LockAddedEventFilter;

    "LockBlocksUpdated(uint256)"(blocks?: null): LockBlocksUpdatedEventFilter;
    LockBlocksUpdated(blocks?: null): LockBlocksUpdatedEventFilter;

    "LockReleased(address,uint256,uint256)"(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null,
      amount?: null
    ): LockReleasedEventFilter;
    LockReleased(
      buyer?: PromiseOrValue<string> | null,
      lockId?: null,
      amount?: null
    ): LockReleasedEventFilter;

    "LockReturned(address,uint256)"(
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

    "ReputationUpdated(address)"(
      reputation?: null
    ): ReputationUpdatedEventFilter;
    ReputationUpdated(reputation?: null): ReputationUpdatedEventFilter;

    "RootUpdated(address,bytes32)"(
      seller?: PromiseOrValue<string> | null,
      merkleRoot?: PromiseOrValue<BytesLike> | null
    ): RootUpdatedEventFilter;
    RootUpdated(
      seller?: PromiseOrValue<string> | null,
      merkleRoot?: PromiseOrValue<BytesLike> | null
    ): RootUpdatedEventFilter;

    "TrustedForwarderUpdated(address,bool)"(
      forwarder?: PromiseOrValue<string> | null,
      state?: PromiseOrValue<boolean> | null
    ): TrustedForwarderUpdatedEventFilter;
    TrustedForwarderUpdated(
      forwarder?: PromiseOrValue<string> | null,
      state?: PromiseOrValue<boolean> | null
    ): TrustedForwarderUpdatedEventFilter;

    "ValidSet(address,address,bool)"(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      state?: null
    ): ValidSetEventFilter;
    ValidSet(
      seller?: PromiseOrValue<string> | null,
      token?: null,
      state?: null
    ): ValidSetEventFilter;

    "ValidSignersUpdated(address[])"(
      signers?: null
    ): ValidSignersUpdatedEventFilter;
    ValidSignersUpdated(signers?: null): ValidSignersUpdatedEventFilter;
  };

  estimateGas: {
    allowedERC20s(
      erc20: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<BigNumber>;

    isTrustedForwarder(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    reputation(overrides?: CallOverrides): Promise<BigNumber>;

    sellerAllowList(
      sellerKey: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setDefaultLockBlocks(
      _blocks: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setReputation(
      _reputation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setTrustedFowarders(
      forwarders: PromiseOrValue<string>[],
      states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setValidSigners(
      _validSigners: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    tokenSettings(
      _tokens: PromiseOrValue<string>[],
      _states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    validBacenSigners(
      signer: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdrawBalance(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    allowedERC20s(
      erc20: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    defaultLockBlocks(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isTrustedForwarder(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    reputation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sellerAllowList(
      sellerKey: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setDefaultLockBlocks(
      _blocks: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setOwner(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setReputation(
      _reputation: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setTrustedFowarders(
      forwarders: PromiseOrValue<string>[],
      states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setValidSigners(
      _validSigners: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    tokenSettings(
      _tokens: PromiseOrValue<string>[],
      _states: PromiseOrValue<boolean>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    validBacenSigners(
      signer: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdrawBalance(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}