export const FIELD_CLASS =
  "h-11 w-full rounded-lg border border-neutral-300 px-3 text-base outline-none focus:border-neutral-500";

export const SELECT_CLASS = `${FIELD_CLASS} appearance-none bg-white bg-no-repeat pr-9`;

export const SELECT_CHEVRON = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 0.6rem center",
  backgroundSize: "1.25em 1.25em",
} as const;
