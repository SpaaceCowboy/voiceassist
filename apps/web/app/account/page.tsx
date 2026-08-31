import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountForm } from "@/features/account/account-form";
export default function AccountPage() { return <><Header /><main className="container-page py-16"><Suspense><AccountForm /></Suspense></main><Footer /></>; }
