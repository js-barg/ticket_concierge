type Props = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
};

const inputClass =
  'w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export function AdminFormField({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  children,
  className = ''
}: Props) {
  const id = `field-${name}`;
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-slate-500"> *</span>}
      </label>
      {children ?? (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue != null ? String(defaultValue) : undefined}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function AdminFormTextarea({
  label,
  name,
  required,
  defaultValue,
  placeholder,
  rows = 3
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-slate-500"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        rows={rows}
        className={inputClass}
      />
    </div>
  );
}

export function AdminFormSelect({
  label,
  name,
  required,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
}) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-slate-500"> *</span>}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? undefined}
        className={inputClass}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminFormCheckbox({
  label,
  name,
  defaultChecked
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-slate-500 focus:ring-slate-500"
      />
      <label htmlFor={id} className="text-sm text-slate-300">
        {label}
      </label>
    </div>
  );
}
