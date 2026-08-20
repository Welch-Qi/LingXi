declare module "react-simple-maps" {
  import { SVGProps, ReactNode } from "react"
  export interface ComposableMapProps extends SVGProps<SVGSVGElement> { projectionConfig?: Record<string, unknown>; style?: React.CSSProperties }
  export interface GeographiesProps { geography: string; children: (args: { geographies: GeoFeature[] }) => ReactNode }
  export interface GeoFeature { rsmKey: string; id: string; type: string; properties: Record<string, unknown> }
  export interface GeographyProps extends SVGProps<SVGPathElement> { geography: GeoFeature; style?: { default?: React.CSSProperties; hover?: React.CSSProperties; pressed?: React.CSSProperties } }
  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
}
