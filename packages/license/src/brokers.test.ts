import { describe, expect, it } from "vitest";
import { BROKERS, brokerForServer, findBroker, serverCandidates } from "./brokers";
import { SERVER_PATTERN } from "./index";

describe("BROKERS", () => {
  it("setiap nama broker lolos aturan kolom broker_server di database", () => {
    for (const broker of BROKERS) expect(SERVER_PATTERN.test(broker.name)).toBe(true);
  });
});

describe("findBroker", () => {
  it("mengenali nama broker persis seperti di daftar", () => {
    expect(findBroker("VT Markets")?.serverPrefix).toBe("VTMarkets");
  });

  it("menolak nama lain", () => {
    expect(findBroker("vt markets")).toBeNull();
    expect(findBroker("Exness-MT5Real26")).toBeNull();
    expect(findBroker(null)).toBeNull();
  });
});

describe("brokerForServer", () => {
  it.each(["VTMarkets-Live", "VTMarkets-Live 3", "vtmarkets-demo", "VTMarkets"])("mencocokkan %s ke VT Markets", (server) => {
    expect(brokerForServer(server)?.name).toBe("VT Markets");
  });

  it.each(["VTMarketsX-Live", "Exness-MT5Real26", "MyVTMarkets-Live"])("tidak mencocokkan %s", (server) => {
    expect(brokerForServer(server)).toBeNull();
  });
});

describe("serverCandidates", () => {
  it("mendahulukan nama broker, lalu nama server persis", () => {
    expect(serverCandidates("VTMarkets-Live 3")).toEqual(["VT Markets", "VTMarkets-Live 3"]);
  });

  it("hanya nama server persis untuk broker yang tidak dikenal", () => {
    expect(serverCandidates("Exness-MT5Real26")).toEqual(["Exness-MT5Real26"]);
  });
});
