interface GooeySvgFilterProps {
  id: string;
  strength?: number;
}

export default function GooeySvgFilter({ id, strength = 15 }: GooeySvgFilterProps) {
  return (
    <svg width="0" height="0">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
