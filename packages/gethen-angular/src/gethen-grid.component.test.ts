import { describe, expect, it } from "vitest";

import { GethenGridComponent } from "./gethen-grid.component.js";
import { resolveAngularGridColumns } from "./gethen-angular-registry.js";

describe("GethenGridComponent", () => {
  it("can be imported without browser globals", () => {
    expect(GethenGridComponent).toBeDefined();
  });

  it("requires explicit Angular registry keys without importing Angular into Core", () => {
    expect(() => resolveAngularGridColumns({
      columns: [{
        id: "name",
        title: "Name",
        dataType: "text",
        angularRenderer: "missing"
      }],
      applicationRef: {} as never,
      environmentInjector: {} as never
    })).toThrow(/Unknown Angular renderer registry key 'missing'/);
  });
});
