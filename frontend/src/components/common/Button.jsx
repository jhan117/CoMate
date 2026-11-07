import styles from "./Button.module.css";

function Button({
  as = "button",
  type = "button",
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const Component = as;
  const combinedClassName = [
    styles.btn,
    styles[variant] || styles.secondary,
    styles[size] || styles.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (Component === "a") {
    return (
      <a className={combinedClassName} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Component type={type} className={combinedClassName} {...rest}>
      {children}
    </Component>
  );
}

export default Button;
