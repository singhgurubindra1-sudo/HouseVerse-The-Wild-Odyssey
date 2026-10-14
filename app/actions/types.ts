export interface ActionState {
  ok: boolean;
  message: string;
}

export const initialState: ActionState = { ok: false, message: "" };
