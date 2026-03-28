export default function ContactInformation({ contact = {} }) {
  return (
    <div className="bg-slate-800 text-white rounded-lg p-8 mb-8" style={{ backgroundColor: '#1E293B' }}>
      <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
      <p className="text-sm mb-6">For further information or to arrange property inspection:</p>
      <div className="space-y-2 text-sm">
        {contact.organization && <p className="font-semibold">{contact.organization}</p>}
        {contact.email && <p>Email: {contact.email}</p>}
        {contact.phone && <p>Phone: {contact.phone}</p>}
        {contact.caseNumber && <p>Case Number: {contact.caseNumber}</p>}
      </div>
    </div>
  )
}
