'use client'
import dynamic from 'next/dynamic'
import '@scalar/api-reference-react/style.css'

const ApiReferenceReact = dynamic(
    () => import('@scalar/api-reference-react').then((mod) => mod.ApiReferenceReact),
    { ssr: false }
)

export default function References() {
    return (
        <ApiReferenceReact
            configuration={{
                defaultHttpClient: {
                    targetKey: 'node',
                    clientKey: 'fetch',
                },
                url: '/openapi.yaml',
                defaultOpenAllTags: true,
                hideClientButton: true,
                hideDarkModeToggle: true,
                expandAllResponses: true,
                showSidebar: true,
                showDeveloperTools: "never",
                operationTitleSource: "summary",
                theme: "bluePlanet",
                persistAuth: false,
                telemetry: true,
                layout: "modern",
                isEditable: false,
                isLoading: false,
                hideModels: true,
                documentDownloadType: "both",
                hideTestRequestButton: false,
                hideSearch: false,
                showOperationId: false,
                withDefaultFonts: true,
                expandAllModelSections: false,
                orderSchemaPropertiesBy: "alpha",
                orderRequiredPropertiesFirst: true,
                _integration: "react",
                default: false,
                slug: "api-1",
                title: "API #1"
            }}
        />
    )
}