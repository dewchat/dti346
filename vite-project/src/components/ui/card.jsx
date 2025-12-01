
function Card({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props} />
  );
}

export default Card
