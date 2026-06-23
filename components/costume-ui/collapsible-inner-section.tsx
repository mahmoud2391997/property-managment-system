type innerSectionTitleProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const InnerSection = ({
  children,
  title,
  subtitle
}: innerSectionTitleProps) => {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col'>
        <span className='texts-body-large-medium'>{title}</span>
        {subtitle && (
          <span className='texts-caption-large text-(--text-secondary)'>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default InnerSection