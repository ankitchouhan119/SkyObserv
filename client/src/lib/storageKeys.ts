export function storageEndpointKey(name: string): string {
  return name.toLowerCase().replace(/^rediss?:\/\//, "").split("@").pop()?.split("/")[0] ?? name.toLowerCase();
}
