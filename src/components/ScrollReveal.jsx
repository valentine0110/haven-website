import React from "react";
import { useIntersection } from "../lib/hooks";

/**
 * Wrapper that animates children into view when they scroll into the viewport.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elements to reveal
 * @param {"up"|"left"|"right"|"fade"} [props.direction="up"] - Animation direction
 * @param {number} [props.delay=0] - Stagger delay in ms
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {React.ElementType} [props.as="div"] - HTML tag to render
 */
export default function ScrollReveal({ children, direction = "up", delay = 0, className = "", as: Tag = "div", ...props }) {
  const [ref, isVisible] = useIntersection();
  const dirClass = `reveal-${direction}`;
  return (
    <Tag
      ref={ref}
      className={`reveal ${dirClass} ${isVisible ? "revealed" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

ScrollReveal.displayName = 'ScrollReveal';

/**
 * Stagger-wrap multiple children so they animate in one after another.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elements to stagger reveal
 * @param {number} [props.stagger=100] - Delay increment per child in ms
 * @param {"up"|"left"|"right"|"fade"} [props.direction="up"] - Animation direction
 * @param {string} [props.className=""] - Additional CSS classes
 */
export function StaggerReveal({ children, stagger = 100, direction = "up", className = "", ...props }) {
  const [ref, isVisible] = useIntersection();
  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const childClass = child.props.className || "";
        const childStyle = child.props.style || {};
        return React.cloneElement(child, {
          className: `${childClass} reveal reveal-${direction} ${isVisible ? "revealed" : ""}`.trim(),
          style: { ...childStyle, transitionDelay: `${i * stagger}ms` }
        });
      })}
    </div>
  );
}

StaggerReveal.displayName = 'StaggerReveal';
