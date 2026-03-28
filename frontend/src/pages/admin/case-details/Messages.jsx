// src/pages/admin/case-details/Messages.jsx
import { useCaseContext } from '../../../context/CaseContext'
import { useAuth } from '../../../context/AuthContext'
import CaseChat from '../../../components/common/CaseChat'

export default function Messages() {
    const { caseData } = useCaseContext()
    const { user } = useAuth()

    return (
        <CaseChat
            caseId={caseData?._id}
            currentUser={{ name: user?.name, role: 'Admin' }}
        />
    )
}
