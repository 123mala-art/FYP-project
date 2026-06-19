function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

// export function getApiBaseUrl() {
//   const configuredUrl = process.env.REACT_APP_BACKEND_URL;

export function getApiBaseUrl() {
  return "https://fyp-project-hkch.onrender.com";
}

  if (configuredUrl && configuredUrl.trim()) {
    return trimTrailingSlash(configuredUrl.trim());
  }

  // if (process.env.NODE_ENV === "production") {
  //   return `${window.location.origin}/api`;
  // }

  if (configuredUrl && configuredUrl.trim()) {
  return trimTrailingSlash(configuredUrl.trim());
}

  return `${window.location.protocol}//${window.location.hostname}:5000`;
}

export function getFrontendBaseUrl() {
  const configuredUrl = process.env.REACT_APP_FRONTEND_URL;

  if (configuredUrl && configuredUrl.trim()) {
    return trimTrailingSlash(configuredUrl.trim());
  }

  return window.location.origin;
}
