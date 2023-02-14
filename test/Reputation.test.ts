import "@nomicfoundation/hardhat-chai-matchers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { Reputation } from "../src/types";
import { curve, repFixture } from "./utils/fixtures";

describe("Reputation", () => {
  // contract deployer/admin
  let owner: SignerWithAddress;
  // Reputation Interface instance;
  let reputation: Reputation;

  before("Set signers and reset network", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [owner] = await (ethers as any).getSigners();

    await network.provider.send("hardhat_reset");
  });
  beforeEach("Load deployment fixtures", async () => {
    ({ reputation } = await loadFixture(repFixture));
  });

  // describe("Limiter", async () => {
  //   it("Curve reliability", async () => {
  //     const tx1 = await reputation.connect(owner).limiter(0);
  //     const tx2 = await reputation.limiter(500);
  //     const tx3 = await reputation
  //       .connect(owner)
  //       .limiter(444444);
  //     const tx4 = await reputation.limiter(988700);

  //     expect(tx1).to.eq(curve(0));
  //     expect(tx2).to.eq(curve(500));
  //     expect(tx3).to.eq(curve(444444));
  //     expect(tx4).to.eq(curve(988700));
  //   });
  // });

  describe("Limiter", async () => {
    it("Curve reliability", async () => {
      const testCases = [
        {
          x: 0,
          expected: curve(0),
        },
        {
          x: 500,
          expected: curve(500),
        },
        {
          x: 444444,
          expected: curve(444444),
        },
        {
          x: 988700,
          expected: curve(988700),
        },
        {
          x: Number.MAX_SAFE_INTEGER,
          shouldRevert: "overflow",
        },
        {
          x: Number.POSITIVE_INFINITY,
          shouldRevert: "overflow",
        },
        {
          x: Number.NEGATIVE_INFINITY,
          shouldRevert: "overflow",
        },
        {
          x: -1,
          shouldRevert: "value out-of-bounds",
        },
        {
          x: Number.NaN,
          shouldRevert: "invalid BigNumber string",
        },
      ];

      for (const testCase of testCases) {
        if (testCase.shouldRevert != undefined) {
          await expect(reputation.limiter(testCase.x)).to.be
            .rejected;
        } else {
          const result = await reputation.limiter(testCase.x);
          expect(result).to.eq(testCase.expected).and.to.be
            .ok;
        }
      }
    });
  });
});
