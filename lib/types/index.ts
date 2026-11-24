/**
 * The single source of truth for the Sheba Shathi domain model.
 * The mock API in lib/mocks and the real backend both conform to these shapes,
 * which is what makes the mock→real swap a config change.
 */
export * from "./api";
export * from "./auth";
export * from "./common";
export * from "./consultation";
export * from "./doctor";
export * from "./notification";
export * from "./patient";
export * from "./prescription";
export * from "./report";
export * from "./triage";
