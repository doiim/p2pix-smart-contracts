/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  Signer,
  utils,
} from "ethers";
import type { EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface EventAndErrorsInterface extends utils.Interface {
  functions: {};

  events: {
    "AllowedERC20Updated(address,bool)": EventFragment;
    "DepositAdded(address,address,uint256)": EventFragment;
    "DepositWithdrawn(address,address,uint256)": EventFragment;
    "FundsWithdrawn(address,uint256)": EventFragment;
    "LockAdded(address,uint256,uint256,uint256)": EventFragment;
    "LockBlocksUpdated(uint256)": EventFragment;
    "LockReleased(address,uint256,uint256)": EventFragment;
    "LockReturned(address,uint256)": EventFragment;
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
  seller: BigNumber;
  amount: BigNumber;
}
export type LockAddedEvent = TypedEvent<
  [string, BigNumber, BigNumber, BigNumber],
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

export interface EventAndErrors extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: EventAndErrorsInterface;

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

  functions: {};

  callStatic: {};

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

    "LockAdded(address,uint256,uint256,uint256)"(
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

  estimateGas: {};

  populateTransaction: {};
}
