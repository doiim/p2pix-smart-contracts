import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import type { NetworkHelpers } from "@nomicfoundation/hardhat-network-helpers/types";
import { expect } from "chai";
import hre from "hardhat";

import type { Reputation } from "../src/types/index.ts";
import { curve, repFixture } from "./utils/fixtures.ts";

describe("Reputation", () => {
  // Reputation Interface instance;
  let reputation: Reputation;
  let ethers: HardhatEthers;
  let networkHelpers: NetworkHelpers;

  before("Set signers and reset network", async () => {
    ({ ethers, networkHelpers } =
      await hre.network.getOrCreate());
    await ethers.getSigners();
  });
  beforeEach("Load deployment fixtures", async () => {
    ({ reputation } =
      await networkHelpers.loadFixture(repFixture));
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
          expected: curve(Number.MAX_SAFE_INTEGER),
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
          // ethers rejects invalid args client-side (sync throw or
          // rejected promise), so catch both.
          let threw = false;
          try {
            await reputation.limiter(testCase.x);
          } catch {
            threw = true;
          }
          expect(threw).to.be.true;
        } else {
          const result = await reputation.limiter(testCase.x);
          expect(result).to.eq(testCase.expected).and.to.be
            .ok;
        }
      }
    });
  });
});
