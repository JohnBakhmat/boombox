import "../styles.css";
import "virtual:uno.css";
import "@unocss/reset/tailwind.css";

import type { ReactNode } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { Providers } from "@/components/providers";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
	const data = await getData();

	return (
		<>
			<meta name="description" content={data.description} />
			<link rel="icon" type="image/png" href={data.icon} />
			<div className="font-['Geist'] pb-36 w-full overflow-x-hidden min-h-screen antialiased flex flex-col items-center h-auto">
				<Providers>
					<main className="">{children}</main>
					<AudioPlayer />
				</Providers>
			</div>
		</>
	);
}

const getData = async () => {
	const data = {
		description: "An internet website!",
		icon: "/images/favicon.png",
	};

	return data;
};

export const getConfig = async () => {
	return {
		render: "static",
	} as const;
};
