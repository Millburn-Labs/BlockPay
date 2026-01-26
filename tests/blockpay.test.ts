import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const employer1 = accounts.get("wallet_1")!;
const employee1 = accounts.get("wallet_3")!;
const employee2 = accounts.get("wallet_4")!;
const admin = accounts.get("wallet_5")!;

describe("BlockPay - Access Control Tests", () => {
  it("should set contract owner correctly", () => {
    const owner = simnet.callReadOnlyFn(
      "access-control",
      "get-owner",
      [],
      deployer
    );
    expect(owner.result).toBePrincipal(deployer);
  });

  it("should allow owner to add admin", () => {
    const { result } = simnet.callPublicFn(
      "access-control",
      "add-admin",
      [Cl.principal(admin)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const isAdmin = simnet.callReadOnlyFn(
      "access-control",
      "is-admin",
      [Cl.principal(admin)],
      deployer
    );
    expect(isAdmin.result).toBeBool(true);
  });

  it("should allow admin to add employer", () => {
    // First add admin
    simnet.callPublicFn(
      "access-control",
      "add-admin",
      [Cl.principal(admin)],
      deployer
    );

    // Admin adds employer
    const { result } = simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      admin
    );
    expect(result).toBeOk(Cl.bool(true));

    const isEmployer = simnet.callReadOnlyFn(
      "access-control",
      "is-employer",
      [Cl.principal(employer1)],
      deployer
    );
    expect(isEmployer.result).toBeBool(true);
  });

  it("should prevent unauthorized admin addition", () => {
    const { result } = simnet.callPublicFn(
      "access-control",
      "add-admin",
      [Cl.principal(admin)],
      employee1
    );
    expect(result).toBeErr(Cl.uint(1000)); // ERR_UNAUTHORIZED
  });
});

describe("BlockPay - Treasury Tests", () => {
  beforeEach(() => {
    // Setup: Add employer
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
  });

  it("should allow STX deposits", () => {
    const depositAmount = 1000000; // 1 STX

    const { result } = simnet.callPublicFn(
      "treasury",
      "deposit-stx",
      [Cl.uint(depositAmount)],
      employer1
    );
    expect(result).toBeOk(Cl.bool(true));

    const balance = simnet.callReadOnlyFn(
      "treasury",
      "get-employer-stx-balance",
      [Cl.principal(employer1)],
      deployer
    );
    expect(balance.result).toBeUint(depositAmount);
  });

  it("should track total deposits", () => {
    const amount1 = 1000000;
    const amount2 = 2000000;

    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(amount1)], employer1);
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(amount2)], employer1);

    const totalDeposits = simnet.callReadOnlyFn(
      "treasury",
      "get-total-stx-deposits",
      [],
      deployer
    );
    expect(totalDeposits.result).toBeUint(amount1 + amount2);
  });

  it("should only allow whitelisted contracts to withdraw", () => {
    // Deposit first
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(1000000)], employer1);

    // Try to withdraw without being whitelisted
    const { result } = simnet.callPublicFn(
      "treasury",
      "withdraw-stx",
      [Cl.principal(employer1), Cl.uint(500000), Cl.principal(employee1)],
      employee1
    );
    expect(result).toBeErr(Cl.uint(2004)); // ERR_NOT_WHITELISTED
  });

  it("should prevent withdrawal of more than deposited", () => {
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(1000000)], employer1);

    // Whitelist blockpay contract
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "treasury",
      "withdraw-stx",
      [Cl.principal(employer1), Cl.uint(2000000), Cl.principal(employee1)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(2001)); // ERR_INSUFFICIENT_BALANCE
  });
});

describe("BlockPay - Stream Math Tests", () => {
  it("should calculate rate per block correctly", () => {
    const totalAmount = 10000000; // 10 STX
    const durationBlocks = 1000;

    const rate = simnet.callReadOnlyFn(
      "stream-math",
      "calculate-rate-per-block",
      [Cl.uint(totalAmount), Cl.uint(durationBlocks)],
      deployer
    );
    expect(rate.result).toBeOk(Cl.uint(10000)); // 10000 per block
  });

  it("should calculate earned amount correctly", () => {
    const currentBlock = 1100;
    const lastBlock = 1000;
    const ratePerBlock = 10000;

    const earned = simnet.callReadOnlyFn(
      "stream-math",
      "calculate-earned",
      [Cl.uint(currentBlock), Cl.uint(lastBlock), Cl.uint(ratePerBlock)],
      deployer
    );
    expect(earned.result).toBeOk(Cl.uint(1000000)); // 100 blocks * 10000
  });

  it("should calculate linear vesting correctly", () => {
    const totalAmount = 10000000;
    const startBlock = 1000;
    const endBlock = 2000;
    const currentBlock = 1500; // Halfway

    const vested = simnet.callReadOnlyFn(
      "stream-math",
      "calculate-linear-vested",
      [
        Cl.uint(totalAmount),
        Cl.uint(startBlock),
        Cl.uint(endBlock),
        Cl.uint(currentBlock),
      ],
      deployer
    );
    expect(vested.result).toBeOk(Cl.uint(5000000)); // Half vested
  });

  it("should handle cliff vesting correctly", () => {
    const totalAmount = 10000000;
    const startBlock = 1000;
    const cliffBlock = 1500;
    const endBlock = 2000;
    const currentBlock = 1400; // Before cliff

    const vested = simnet.callReadOnlyFn(
      "stream-math",
      "calculate-cliff-vested",
      [
        Cl.uint(totalAmount),
        Cl.uint(startBlock),
        Cl.uint(cliffBlock),
        Cl.uint(endBlock),
        Cl.uint(currentBlock),
      ],
      deployer
    );
    expect(vested.result).toBeOk(Cl.uint(0)); // Nothing vested before cliff
  });
});

describe("BlockPay - Emergency Controls Tests", () => {
  it("should allow admin to pause system", () => {
    const { result } = simnet.callPublicFn(
      "emergency-controls",
      "pause-system",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const isPaused = simnet.callReadOnlyFn(
      "emergency-controls",
      "is-global-paused",
      [],
      deployer
    );
    expect(isPaused.result).toBeBool(true);
  });

  it("should prevent non-admin from pausing", () => {
    const { result } = simnet.callPublicFn(
      "emergency-controls",
      "pause-system",
      [],
      employee1
    );
    expect(result).toBeErr(Cl.uint(4000)); // ERR_UNAUTHORIZED
  });

  it("should allow pausing individual streams", () => {
    const streamId = 1;

    const { result } = simnet.callPublicFn(
      "emergency-controls",
      "pause-stream",
      [Cl.uint(streamId)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const isPaused = simnet.callReadOnlyFn(
      "emergency-controls",
      "is-stream-paused",
      [Cl.uint(streamId)],
      deployer
    );
    expect(isPaused.result).toBeBool(true);
  });

  it("should check operational status correctly", () => {
    const isOp1 = simnet.callReadOnlyFn(
      "emergency-controls",
      "is-operational",
      [],
      deployer
    );
    expect(isOp1.result).toBeBool(true);

    // Pause system
    simnet.callPublicFn("emergency-controls", "pause-system", [], deployer);

    const isOp2 = simnet.callReadOnlyFn(
      "emergency-controls",
      "is-operational",
      [],
      deployer
    );
    expect(isOp2.result).toBeBool(false);
  });
});

describe("BlockPay - Stream Creation Tests", () => {
  beforeEach(() => {
    // Setup
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(10000000)], employer1);
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );
  });

  it("should create a basic stream", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(1000000), // 1 STX
        Cl.uint(1000), // 1000 blocks
        Cl.stringAscii("linear"),
        Cl.none(),
        Cl.bool(true),
        Cl.stringUtf8("Monthly salary"),
      ],
      employer1
    );
    expect(result).toBeOk(Cl.uint(1)); // Stream ID 1
  });

  it("should prevent non-employer from creating stream", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(1000000),
        Cl.uint(1000),
        Cl.stringAscii("linear"),
        Cl.none(),
        Cl.bool(true),
        Cl.stringUtf8("Test"),
      ],
      employee1
    );
    expect(result).toBeErr(Cl.uint(5000)); // ERR_UNAUTHORIZED
  });

  it("should prevent creating stream with insufficient funds", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(20000000), // More than deposited
        Cl.uint(1000),
        Cl.stringAscii("linear"),
        Cl.none(),
        Cl.bool(true),
        Cl.stringUtf8("Test"),
      ],
      employer1
    );
    expect(result).toBeErr(Cl.uint(5003)); // ERR_INSUFFICIENT_FUNDS
  });

  it("should create stream with cliff vesting", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(1000000),
        Cl.uint(1000),
        Cl.stringAscii("cliff-linear"),
        Cl.some(Cl.uint(500)), // Cliff at 500 blocks
        Cl.bool(true),
        Cl.stringUtf8("Vested salary"),
      ],
      employer1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("BlockPay - Withdrawal Tests", () => {
  let streamId: number;

  beforeEach(() => {
    // Setup
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(10000000)], employer1);
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );

    // Create stream
    simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(1000000),
        Cl.uint(1000),
        Cl.stringAscii("linear"),
        Cl.none(),
        Cl.bool(true),
        Cl.stringUtf8("Test stream"),
      ],
      employer1
    );
    streamId = 1;
  });

  it("should allow employee to withdraw earned amount", () => {
    // Mine some blocks to accrue earnings
    simnet.mineEmptyBlocks(100);

    const { result } = simnet.callPublicFn(
      "blockpay",
      "withdraw",
      [Cl.uint(streamId)],
      employee1
    );
    // Should succeed and return withdrawn amount
    expect(result).not.toBeErr(Cl.uint);
  });

  it("should prevent withdrawal by non-employee", () => {
    simnet.mineEmptyBlocks(100);

    const { result } = simnet.callPublicFn(
      "blockpay",
      "withdraw",
      [Cl.uint(streamId)],
      employee2
    );
    expect(result).toBeErr(Cl.uint(5000)); // ERR_UNAUTHORIZED
  });

  it("should prevent withdrawal when stream is paused", () => {
    simnet.mineEmptyBlocks(100);

    // Pause the stream
    simnet.callPublicFn(
      "emergency-controls",
      "pause-stream",
      [Cl.uint(streamId)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "blockpay",
      "withdraw",
      [Cl.uint(streamId)],
      employee1
    );
    expect(result).toBeErr(Cl.uint(5007)); // ERR_STREAM_PAUSED
  });
});

describe("BlockPay - Stream Modification Tests", () => {
  let streamId: number;

  beforeEach(() => {
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(10000000)], employer1);
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );

    simnet.callPublicFn(
      "blockpay",
      "create-stream",
      [
        Cl.principal(employee1),
        Cl.uint(1000000),
        Cl.uint(1000),
        Cl.stringAscii("linear"),
        Cl.none(),
        Cl.bool(true), // Can modify
        Cl.stringUtf8("Test"),
      ],
      employer1
    );
    streamId = 1;
  });

  it("should allow employer to extend stream duration", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "extend-stream",
      [Cl.uint(streamId), Cl.uint(500)], // Add 500 blocks
      employer1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should allow employer to increase stream amount", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "increase-stream-amount",
      [Cl.uint(streamId), Cl.uint(500000)], // Add 0.5 STX
      employer1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should prevent non-employer from modifying stream", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "extend-stream",
      [Cl.uint(streamId), Cl.uint(500)],
      employee1
    );
    expect(result).toBeErr(Cl.uint(5000)); // ERR_UNAUTHORIZED
  });
});

describe("BlockPay - Batch Operations Tests", () => {
  beforeEach(() => {
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(50000000)], employer1);
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );
  });

  it("should create multiple streams in batch", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "batch-create-streams",
      [
        Cl.list([Cl.principal(employee1), Cl.principal(employee2)]),
        Cl.list([Cl.uint(1000000), Cl.uint(2000000)]),
        Cl.list([Cl.uint(1000), Cl.uint(1000)]),
        Cl.stringAscii("linear"),
        Cl.bool(true),
      ],
      employer1
    );
    expect(result).toBeOk(Cl.list([Cl.uint(1), Cl.uint(2)]));
  });
});

describe("BlockPay - Bonus Payment Tests", () => {
  beforeEach(() => {
    simnet.callPublicFn(
      "access-control",
      "add-employer",
      [Cl.principal(employer1)],
      deployer
    );
    simnet.callPublicFn("treasury", "deposit-stx", [Cl.uint(10000000)], employer1);
    simnet.callPublicFn(
      "treasury",
      "set-whitelisted",
      [Cl.contractPrincipal(simnet.deployer, "blockpay"), Cl.bool(true)],
      deployer
    );
  });

  it("should allow employer to pay bonus", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "add-bonus",
      [
        Cl.principal(employee1),
        Cl.uint(500000), // 0.5 STX bonus
        Cl.stringUtf8("Performance bonus"),
      ],
      employer1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should prevent non-employer from paying bonus", () => {
    const { result } = simnet.callPublicFn(
      "blockpay",
      "add-bonus",
      [Cl.principal(employee1), Cl.uint(500000), Cl.stringUtf8("Bonus")],
      employee1
    );
    expect(result).toBeErr(Cl.uint(5000)); // ERR_UNAUTHORIZED
  });
});
