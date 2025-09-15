"use client";

import { Provider as JotaiProvider } from "jotai";
import { ReactNode } from "react";

type Props = {
	children: ReactNode;
};
export function Providers({ children }: Props) {
	return <JotaiProvider>{children}</JotaiProvider>;
}
