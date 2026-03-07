import { sileo, type SileoOptions, type SileoPosition } from "sileo";

type NotifyContent = string | Pick<SileoOptions, "title" | "description" | "position" | "duration" | "button">;

function toOptions(content: NotifyContent): SileoOptions {
  if (typeof content === "string") {
    return { title: content };
  }

  return content;
}

export const notify = {
  show: (content: NotifyContent) => sileo.show(toOptions(content)),
  success: (content: NotifyContent) => sileo.success(toOptions(content)),
  error: (content: NotifyContent) => sileo.error(toOptions(content)),
  warning: (content: NotifyContent) => sileo.warning(toOptions(content)),
  info: (content: NotifyContent) => sileo.info(toOptions(content)),
  dismiss: (id: string) => sileo.dismiss(id),
  clear: (position?: SileoPosition) => sileo.clear(position),
};
