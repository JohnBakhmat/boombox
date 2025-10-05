import "../styles.css";

import type { ReactNode } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { Providers } from "@/components/providers";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
	const data = await getData();

	return (
		<>
			<meta name="description" content={data.description} />
			<link rel="icon" type="image/png" href={data.icon} />
			<div className="font-['Geist'] pb-36 w-full overflow-x-hidden min-h-screen flex flex-col antialiased h-auto">
				<Providers>
					<SidebarProvider>
						<AppSidebar />
						<main className="w-full">{children}</main>
						<AudioPlayer />
					</SidebarProvider>
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
