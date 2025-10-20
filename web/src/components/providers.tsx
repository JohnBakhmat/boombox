"use client";

import { Provider as JotaiProvider } from "jotai";
import { ReactNode } from "react";
import { PostHogProvider } from "posthog-js/react";

type Props = {
	children: ReactNode;
};
export function Providers({ children }: Props) {
	return (
		<PostHogProvider
			apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
			options={{
				api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
				defaults: '2025-05-24',
				capture_exceptions: true, // This enables capturing exceptions using Error Tracking
				debug: import.meta.env.MODE === "development",
			}}
		>
			<JotaiProvider>{children}</JotaiProvider>
		</PostHogProvider>
	);
}