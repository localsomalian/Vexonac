import { SiteHeader } from "./panel-header";

export function ContentLayout({
  title,
  breadcrumb,
  children,
}: {
  title: string | React.ReactNode;
  breadcrumb?: { title: string; url: string };
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader
        title={title}
        breadcrumb={
          breadcrumb
            ? { title: breadcrumb.title, url: breadcrumb.url }
            : undefined
        }
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col">
          <div className="flex flex-col gap-4 p-4 md:p-5 md:gap-5">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
