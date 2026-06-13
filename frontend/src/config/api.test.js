import { getApiBaseUrl, getFrontendBaseUrl } from "./api";

describe("API URL configuration", () => {
  const originalEnv = process.env;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.REACT_APP_BACKEND_URL;
    delete process.env.REACT_APP_FRONTEND_URL;

    delete window.location;
    window.location = {
      protocol: "https:",
      hostname: "smart-code-editor.vercel.app",
      origin: "https://smart-code-editor.vercel.app",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    window.location = originalLocation;
  });

  test("uses REACT_APP_BACKEND_URL when it is configured", () => {
    process.env.REACT_APP_BACKEND_URL = "https://api.example.com/";

    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  test("uses same-origin api path in production when no backend URL is configured", () => {
    process.env.NODE_ENV = "production";

    expect(getApiBaseUrl()).toBe("https://smart-code-editor.vercel.app/api");
  });

  test("uses local backend in development when no backend URL is configured", () => {
    process.env.NODE_ENV = "development";
    window.location = {
      protocol: "http:",
      hostname: "localhost",
      origin: "http://localhost:3000",
    };

    expect(getApiBaseUrl()).toBe("http://localhost:5000");
  });

  test("uses current origin for share links unless frontend URL is configured", () => {
    expect(getFrontendBaseUrl()).toBe("https://smart-code-editor.vercel.app");

    process.env.REACT_APP_FRONTEND_URL = "https://custom.example.com/";
    expect(getFrontendBaseUrl()).toBe("https://custom.example.com");
  });
});
