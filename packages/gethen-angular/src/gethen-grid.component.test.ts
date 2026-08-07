import { describe, expect, it } from "vitest";

import { GethenGridComponent } from "./gethen-grid.component.js";

describe("GethenGridComponent", () => {
  it("can be imported without browser globals", () => {
    expect(GethenGridComponent).toBeDefined();
  });
});
