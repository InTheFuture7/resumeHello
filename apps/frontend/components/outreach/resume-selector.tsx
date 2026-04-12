import type { OutreachResumeListItem } from '@/lib/api/outreach';

interface ResumeSelectorProps {
  label: string;
  placeholder: string;
  resumes: OutreachResumeListItem[];
  value: string;
  onChange: (resumeId: string) => void;
  disabled?: boolean;
}

export function ResumeSelector({
  label,
  placeholder,
  resumes,
  value,
  onChange,
  disabled = false,
}: ResumeSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="outreach-resume-select" className="block font-mono text-sm font-bold">
        {label}
      </label>
      <select
        id="outreach-resume-select"
        aria-label={label}
        className="h-10 w-full border border-black bg-white px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {resumes.map((resume) => (
          <option key={resume.resume_id} value={resume.resume_id}>
            {resume.title || resume.filename || resume.resume_id}
          </option>
        ))}
      </select>
    </div>
  );
}
