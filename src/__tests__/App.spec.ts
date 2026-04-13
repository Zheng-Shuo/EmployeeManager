import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import App from "../App.vue";

describe("App", () => {
  it("mounts renders properly", (): void => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: true,
        },
      },
    });
    expect(wrapper.html()).toContain("router-view-stub");
  });
});
