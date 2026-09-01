import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CornerDownRight,
  CreditCard,
  Edit2,
  ExternalLink,
  Eye,
  GraduationCap,
  Inbox,
  Landmark,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccessRequest, Course, CourseTreasurer, Institution } from '../types';
import { formatCLP } from '../utils/formatters';

interface AdminPanelProps {
  onSelectCourseToManage: (courseId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectCourseToManage }) => {
  const {
    institutions,
    courses,
    students,
    expenses,
    userAccounts,
    currentUser,
    accessRequests,
    submitAccessRequest,
    updateAccessRequestStatus,
    deleteAccessRequest,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    addCourse,
    updateCourse,
    deleteCourse,
    assignTreasurerToCourse,
    removeTreasurerFromCourse,
    deleteUserAccount,
    addUserAccount,
  } = useApp();

  const [adminTab, setAdminTab] = useState<'institutions' | 'courses' | 'treasurers' | 'requests'>('requests');
  const [treasurerSearch, setTreasurerSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  // Institution Form Modal
  const [showInstModal, setShowInstModal] = useState(false);
  const [instToEdit, setInstToEdit] = useState<Institution | null>(null);
  const [instName, setInstName] = useState('');
  const [instCity, setInstCity] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');

  // Course Form Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseInstId, setCourseInstId] = useState(institutions[0]?.id || '');
  const [courseName, setCourseName] = useState('');
  const [courseYear, setCourseYear] = useState(2026);
  const [courseFee, setCourseFee] = useState(5000);
  const [courseDesc, setCourseDesc] = useState('');

  // Treasurer Form Modal
  const [showTreasurerModal, setShowTreasurerModal] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState(courses[0]?.id || '');
  const [treasurerName, setTreasurerName] = useState('');
  const [treasurerEmail, setTreasurerEmail] = useState('');
  const [treasurerPhone, setTreasurerPhone] = useState('+56 9 ');
  const [treasurerRut, setTreasurerRut] = useState('');
  const [treasurerInitialPass, setTreasurerInitialPass] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );

  // Delete confirmations
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'institution' | 'course' | 'treasurer_course' | 'user_account' | 'access_request';
    id: string;
    name: string;
    courseName?: string;
    email?: string;
    role?: string;
  } | null>(null);

  // Institution handlers
  const openAddInstModal = () => {
    setInstToEdit(null);
    setInstName('');
    setInstCity('Santiago');
    setInstAddress('');
    setInstEmail('');
    setInstPhone('+56 9 ');
    setShowInstModal(true);
  };

  const openEditInstModal = (inst: Institution) => {
    setInstToEdit(inst);
    setInstName(inst.name);
    setInstCity(inst.city);
    setInstAddress(inst.address || '');
    setInstEmail(inst.contactEmail || '');
    setInstPhone(inst.contactPhone || '');
    setShowInstModal(true);
  };

  const handleSaveInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) return;

    if (instToEdit) {
      updateInstitution(instToEdit.id, {
        name: instName.trim(),
        city: instCity.trim() || 'Chile',
        address: instAddress.trim() || undefined,
        contactEmail: instEmail.trim() || undefined,
        contactPhone: instPhone.trim() || undefined,
      });
    } else {
      addInstitution({
        name: instName.trim(),
        city: instCity.trim() || 'Chile',
        address: instAddress.trim() || undefined,
        contactEmail: instEmail.trim() || undefined,
        contactPhone: instPhone.trim() || undefined,
      });
    }
    setShowInstModal(false);
  };

  // Course handlers
  const openAddCourseModal = () => {
    setCourseToEdit(null);
    setCourseInstId(institutions[0]?.id || '');
    setCourseName('');
    setCourseYear(2026);
    setCourseFee(5000);
    setCourseDesc('Directiva y actividades anuales');
    setShowCourseModal(true);
  };

  const openEditCourseModal = (course: Course) => {
    setCourseToEdit(course);
    setCourseInstId(course.institutionId);
    setCourseName(course.name);
    setCourseYear(course.year);
    setCourseFee(course.monthlyFee);
    setCourseDesc(course.description || '');
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseInstId) return;

    if (courseToEdit) {
      updateCourse(courseToEdit.id, {
        institutionId: courseInstId,
        name: courseName.trim(),
        year: Number(courseYear),
        monthlyFee: Number(courseFee),
        description: courseDesc.trim() || undefined,
      });
    } else {
      addCourse({
        institutionId: courseInstId,
        name: courseName.trim(),
        year: Number(courseYear),
        monthlyFee: Number(courseFee),
        description: courseDesc.trim() || undefined,
      });
    }
    setShowCourseModal(false);
  };

  // Treasurer handlers
  const openAssignTreasurerModal = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    setTargetCourseId(courseId);
    if (course?.treasurer) {
      setTreasurerName(course.treasurer.fullName);
      setTreasurerEmail(course.treasurer.email);
      setTreasurerPhone(course.treasurer.phone);
      setTreasurerRut(course.treasurer.rut);
    } else {
      setTreasurerName('');
      setTreasurerEmail('');
      setTreasurerPhone('+56 9 ');
      setTreasurerRut('');
    }
    setTreasurerInitialPass(Math.floor(100000 + Math.random() * 900000).toString());
    setShowTreasurerModal(true);
  };

  const handleSaveTreasurer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasurerName.trim() || !targetCourseId) return;

    assignTreasurerToCourse(targetCourseId, {
      fullName: treasurerName.trim(),
      email: treasurerEmail.trim() || 'tesorero@ejemplo.cl',
      phone: treasurerPhone.trim() || '+56 9 1234 5678',
      rut: treasurerRut.trim() || '15.123.456-7',
      initialPassword: treasurerInitialPass.trim() || '123456',
      mustChangePassword: true,
    });

    setShowTreasurerModal(false);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'institution') {
      deleteInstitution(itemToDelete.id);
    } else if (itemToDelete.type === 'course') {
      deleteCourse(itemToDelete.id);
    } else if (itemToDelete.type === 'treasurer_course') {
      removeTreasurerFromCourse(itemToDelete.id);
    } else if (itemToDelete.type === 'user_account') {
      deleteUserAccount(itemToDelete.id);
    } else if (itemToDelete.type === 'access_request') {
      deleteAccessRequest(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const totalAssignedTreasurers = courses.filter((c) => c.treasurer).length;
  const totalCoursesUnassigned = courses.filter((c) => !c.treasurer).length;

  // Filtered lists for treasurers tab
  const filteredCourses = courses.filter((c) => {
    if (!treasurerSearch.trim()) return true;
    const query = treasurerSearch.toLowerCase();
    const inst = institutions.find((i) => i.id === c.institutionId);
    return (
      c.name.toLowerCase().includes(query) ||
      inst?.name.toLowerCase().includes(query) ||
      c.treasurer?.fullName.toLowerCase().includes(query) ||
      c.treasurer?.email.toLowerCase().includes(query) ||
      c.treasurer?.rut.toLowerCase().includes(query)
    );
  });

  const filteredUserAccounts = userAccounts.filter((u) => {
    if (!treasurerSearch.trim()) return true;
    const query = treasurerSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query) ||
      (u.rut && u.rut.toLowerCase().includes(query))
    );
  });

  return (
    <div id="admin-panel-section" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-200">
                Perfil de Administrador General
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestión de Instituciones, Cursos & Apoderados Administradores
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Crea los colegios, niveles de cursos y administra o elimina usuarios de tesorería del sistema.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 text-xs sm:text-sm">
          <button
            id="admin-tab-requests"
            onClick={() => setAdminTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              adminTab === 'requests'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>📥 Solicitudes de Acceso ({accessRequests.length})</span>
            {accessRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="ml-1 bg-white text-orange-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {accessRequests.filter((r) => r.status === 'PENDING').length} pendientes
              </span>
            )}
          </button>
          <button
            id="admin-tab-institutions"
            onClick={() => setAdminTab('institutions')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              adminTab === 'institutions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🏫 Instituciones / Colegios ({institutions.length})
          </button>
          <button
            id="admin-tab-courses"
            onClick={() => setAdminTab('courses')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              adminTab === 'courses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📚 Cursos y Niveles ({courses.length})
          </button>
          <button
            id="admin-tab-treasurers"
            onClick={() => setAdminTab('treasurers')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              adminTab === 'treasurers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>👤 Apoderados Tesoreros & Usuarios ({userAccounts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INSTITUCIONES */}
      {adminTab === 'institutions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Colegios e Instituciones Registradas
            </h3>
            <button
              id="btn-add-institution"
              onClick={openAddInstModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Institución</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map((inst) => {
              const instCourses = courses.filter((c) => c.institutionId === inst.id);
              const totalInstStudents = students.filter((s) =>
                instCourses.some((c) => c.id === s.courseId)
              ).length;

              return (
                <div
                  key={inst.id}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {inst.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {inst.city} {inst.address ? `• ${inst.address}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditInstModal(inst)}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-md"
                        title="Editar institución"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'institution',
                            id: inst.id,
                            name: inst.name,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                        title="Eliminar institución"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Cursos Activos</span>
                      <span className="font-bold text-slate-900">
                        {instCourses.length} cursos
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Total Alumnos</span>
                      <span className="font-bold text-slate-900">
                        {totalInstStudents} estudiantes
                      </span>
                    </div>
                  </div>

                  {inst.contactEmail && (
                    <div className="text-[11px] text-slate-500">
                      Contacto: {inst.contactEmail} {inst.contactPhone ? `(${inst.contactPhone})` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CURSOS */}
      {adminTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Cursos Registrados
            </h3>
            <button
              id="btn-add-course"
              onClick={openAddCourseModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Curso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((course) => {
              const inst = institutions.find((i) => i.id === course.institutionId);
              const courseStds = students.filter((s) => s.courseId === course.id);
              const courseExps = expenses.filter((e) => e.courseId === course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                          {inst?.name || 'Colegio'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">
                          {course.name} ({course.year})
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCourseModal(course)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-md"
                          title="Editar curso"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'course',
                              id: course.id,
                              name: course.name,
                            })
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          title="Eliminar curso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">
                      Cuota mensual: <strong className="text-slate-900">{formatCLP(course.monthlyFee)}</strong> CLP
                    </p>

                    {/* Treasurer Info with Delete/Unassign Option */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Apoderado Tesorero:
                        </span>
                        {course.treasurer && (
                          <button
                            onClick={() =>
                              setItemToDelete({
                                type: 'treasurer_course',
                                id: course.id,
                                name: course.treasurer!.fullName,
                                courseName: course.name,
                                email: course.treasurer!.email,
                              })
                            }
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-medium hover:underline inline-flex items-center gap-0.5"
                            title="Eliminar o desvincular tesorero de este curso"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>

                      {course.treasurer ? (
                        <div className="mt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              {course.treasurer.fullName}
                            </span>
                            <button
                              onClick={() => openAssignTreasurerModal(course.id)}
                              className="text-[10px] text-blue-600 hover:underline font-semibold"
                            >
                              Editar
                            </button>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {course.treasurer.phone} • {course.treasurer.email}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-amber-700 font-medium text-[11px]">Sin tesorero asignado</span>
                          <button
                            onClick={() => openAssignTreasurerModal(course.id)}
                            className="text-[11px] text-blue-600 hover:underline font-semibold"
                          >
                            + Asignar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>{courseStds.length} alumnos</span>
                      <span>{courseExps.length} gastos reg.</span>
                    </div>
                  </div>

                  {/* Action Button: Jump into Course */}
                  <button
                    onClick={() => onSelectCourseToManage(course.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Administrar Cuotas de este Curso</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: APODERADOS TESOREROS Y USUARIOS DE ACCESO */}
      {adminTab === 'treasurers' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-medium block">Tesoreros Asignados</span>
                <span className="text-xl font-bold text-slate-900">{totalAssignedTreasurers}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-medium block">Cursos sin Tesorero</span>
                <span className="text-xl font-bold text-amber-600">{totalCoursesUnassigned}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-medium block">Total Cuentas de Acceso</span>
                <span className="text-xl font-bold text-blue-700">{userAccounts.length}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Buscar por nombre de apoderado, correo, RUT o curso..."
              value={treasurerSearch}
              onChange={(e) => setTreasurerSearch(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent outline-hidden text-slate-800 placeholder-slate-400"
            />
            {treasurerSearch && (
              <button
                onClick={() => setTreasurerSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 mr-1"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* SECTION 1: APODERADOS TESOREROS POR CURSO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  1. Asignación de Tesoreros por Curso
                </h3>
                <p className="text-xs text-slate-500">
                  Apoderados responsables directos de la recaudación y gastos de cada curso.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Apoderado Tesorero</th>
                      <th className="py-3 px-3">RUT</th>
                      <th className="py-3 px-3">Contacto (Teléfono & Email)</th>
                      <th className="py-3 px-3">Curso & Colegio Asignado</th>
                      <th className="py-3 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No se encontraron cursos o tesoreros con el criterio de búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => {
                        const inst = institutions.find((i) => i.id === course.institutionId);
                        const t = course.treasurer;

                        return (
                          <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {t ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    {t.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <span>{t.fullName}</span>
                                    <span className="block text-[10px] text-emerald-700 font-medium">● Activo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                                    ?
                                  </div>
                                  <span className="text-slate-400 italic">Sin asignar</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              {t ? t.rut : '-'}
                            </td>
                            <td className="py-3 px-3 text-slate-700">
                              {t ? (
                                <div>
                                  <div className="flex items-center gap-1 font-mono text-xs">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{t.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{t.email}</span>
                                  </div>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{course.name}</div>
                              <div className="text-[11px] text-slate-500">{inst?.name}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {t ? (
                                  <>
                                    <button
                                      onClick={() => openAssignTreasurerModal(course.id)}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md text-[11px] transition-colors inline-flex items-center gap-1"
                                      title="Editar datos del apoderado"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      id={`btn-delete-treasurer-course-${course.id}`}
                                      onClick={() =>
                                        setItemToDelete({
                                          type: 'treasurer_course',
                                          id: course.id,
                                          name: t.fullName,
                                          courseName: course.name,
                                          email: t.email,
                                        })
                                      }
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-md text-[11px] transition-colors inline-flex items-center gap-1"
                                      title="Eliminar/Desvincular apoderado tesorero de este curso"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Eliminar</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => openAssignTreasurerModal(course.id)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Asignar</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 2: CUENTAS DE USUARIOS REGISTRADAS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  2. Cuentas de Usuarios y Accesos al Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Administra las cuentas con credenciales de inicio de sesión en el portal.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Usuario / Nombre</th>
                      <th className="py-3 px-3">Correo Electrónico (Login)</th>
                      <th className="py-3 px-3">Rol / Nivel de Acceso</th>
                      <th className="py-3 px-3">Curso / Asignación</th>
                      <th className="py-3 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUserAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No se encontraron cuentas de usuario con el criterio de búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredUserAccounts.map((user) => {
                        const assignedCourse = courses.find((c) => c.id === user.assignedCourseId);
                        const assignedInst = institutions.find(
                          (i) => i.id === (assignedCourse?.institutionId || user.assignedInstitutionId)
                        );
                        const isSelf = currentUser?.id === user.id;

                        return (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                    user.role === 'ADMIN_GENERAL'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {isSelf && (
                                      <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded font-normal">
                                        (Tú)
                                      </span>
                                    )}
                                  </div>
                                  {user.rut && (
                                    <span className="text-[10px] font-mono text-slate-400 block">
                                      {user.rut}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">
                              {user.email}
                            </td>
                            <td className="py-3 px-3">
                              {user.role === 'ADMIN_GENERAL' ? (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Admin General</span>
                                </span>
                              ) : user.isReadOnly ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                                    <Eye className="w-3 h-3" />
                                    <span>Tesorero Observador</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500">Solo Lectura</div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                                    <UserCheck className="w-3 h-3" />
                                    <span>Tesorero Titular</span>
                                  </span>
                                  {user.mustChangePassword && (
                                    <div className="text-[10px] text-amber-700 font-semibold">
                                      Pendiente 1er Login
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {user.role === 'ADMIN_GENERAL' ? (
                                <span className="text-slate-500 italic">Acceso Global a Todos los Colegios</span>
                              ) : assignedCourse ? (
                                <div>
                                  <div className="font-semibold text-slate-900">{assignedCourse.name}</div>
                                  <div className="text-[10px] text-slate-500">{assignedInst?.name}</div>
                                </div>
                              ) : (
                                <span className="text-amber-700 font-medium">Sin curso vinculado</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {user.role === 'ADMIN_GENERAL' ? (
                                <span
                                  className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded"
                                  title="La cuenta de Administrador Principal no puede ser eliminada para garantizar el acceso al sistema"
                                >
                                  Cuenta Protegida
                                </span>
                              ) : (
                                <button
                                  id={`btn-delete-user-account-${user.id}`}
                                  onClick={() =>
                                    setItemToDelete({
                                      type: 'user_account',
                                      id: user.id,
                                      name: user.name,
                                      email: user.email,
                                      role: 'Tesorero de Curso',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-md text-[11px] transition-colors inline-flex items-center gap-1"
                                  title={`Eliminar permanentemente la cuenta de ${user.name}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Eliminar Usuario</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: SOLICITUDES DE ACCESO ($3.990 Mes / $34.990 Promo Anual) */}
      {adminTab === 'requests' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Promo & Dispatch Info */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Bandeja de Gestión Comercial
                </span>
                <span className="bg-yellow-300 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-3 h-3 text-slate-900 fill-slate-900" />
                  $3.990 MES / $34.990 PROMO ANUAL
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Solicitudes de Nuevas Cuentas & Derivación al Administrador
              </h3>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                Los visitantes y tesoreros interesados completan el formulario de acceso solicitando su cuenta. Internamente las solicitudes quedan centralizadas aquí y se notifican al correo <strong>jorgetoroduran@gmail.com</strong> para coordinar los cobros ($3.990 Mensual o $34.990 Anual) y activar los cursos.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center shrink-0 min-w-[200px]">
              <div className="text-[11px] uppercase tracking-wider text-amber-200 font-bold">
                Correo Administrador
              </div>
              <div className="text-sm font-mono font-bold text-white mt-0.5 break-all">
                jorgetoroduran@gmail.com
              </div>
              <a
                href="mailto:jorgetoroduran@gmail.com?subject=Gestion%20Cuotin%20Escolar"
                className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-orange-600" />
                <span>Abrir Gmail / Correo</span>
              </a>
            </div>
          </div>

          {/* Stats and Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Filtrar Estado:
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setRequestFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    requestFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({accessRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    requestFilter === 'PENDING'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Pendientes ({accessRequests.filter((r) => r.status === 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('APPROVED')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    requestFilter === 'APPROVED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Aprobadas ({accessRequests.filter((r) => r.status === 'APPROVED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter('REJECTED')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    requestFilter === 'REJECTED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Rechazadas ({accessRequests.filter((r) => r.status === 'REJECTED').length})
                </button>
              </div>
            </div>

            <span className="text-xs text-slate-500">
              Valores de arriendo: <strong>$3.990 CLP/Mes</strong> • Promo Anual: <strong>$34.990 CLP/Año</strong>
            </span>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3.5">Solicitante (Nombres & Email)</th>
                    <th className="py-3 px-3.5">Colegio y Curso</th>
                    <th className="py-3 px-3.5">Plan / Teléfono</th>
                    <th className="py-3 px-3.5">Fecha</th>
                    <th className="py-3 px-3.5">Estado</th>
                    <th className="py-3 px-3.5 text-center">Gestión y Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {accessRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">No hay solicitudes de acceso registradas todavía.</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Cuando los usuarios completen el formulario desde la pantalla de login, aparecerán aquí para gestionar sus accesos y cobro de arriendo mensual ($3.990) o anual ($34.990).
                        </p>
                      </td>
                    </tr>
                  ) : (
                    accessRequests
                      .filter((req) => (requestFilter === 'ALL' ? true : req.status === requestFilter))
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-3.5">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {req.fullName}
                            </div>
                            <div className="font-mono text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{req.email}</span>
                            </div>
                            {req.message && (
                              <div className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-xs line-clamp-1">
                                "{req.message}"
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3.5">
                            <div className="font-semibold text-slate-900">
                              {req.courseName || 'Curso no especificado'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {req.institutionName || 'Colegio no especificado'}
                            </div>
                          </td>

                          <td className="py-3.5 px-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.selectedPlan === 'MONTHLY'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {req.selectedPlan === 'MONTHLY' ? 'Mensual $3.990' : 'Anual $34.990'}
                            </span>
                            <div className="font-mono text-slate-700 text-xs mt-1">
                              {req.phone ? (
                                <a
                                  href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{req.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3.5 px-3.5">
                            {req.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                                <Clock className="w-3 h-3" />
                                <span>Pendiente</span>
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Aprobado / Creado</span>
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                                <X className="w-3 h-3" />
                                <span>Rechazado</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(req)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                                title="Ver detalles y gestionar cobro"
                              >
                                <span>Gestionar</span>
                              </button>

                              {req.status === 'PENDING' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateAccessRequestStatus(req.id, 'APPROVED', 'Cobro coordinado y usuario aprobado');
                                    // Also auto-create user account if not existing
                                    const exists = userAccounts.some((u) => u.email.toLowerCase() === req.email.toLowerCase());
                                    if (!exists) {
                                      addUserAccount({
                                        name: req.fullName,
                                        email: req.email,
                                        password: '123',
                                        role: 'TESORERO_CURSO',
                                        rut: req.rut || '15.000.000-K',
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                                  title="Aprobar y crear cuenta de tesorero"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Aprobar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'access_request',
                                    id: req.id,
                                    name: req.fullName,
                                    email: req.email,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Eliminar solicitud"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Request Details and Approval Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold">Gestión de Solicitud de Acceso</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Pricing Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-800 font-bold block uppercase tracking-wider">
                    Plan Escolar Solicitado
                  </span>
                  <span className="text-base font-black text-amber-950 font-mono">
                    {selectedRequest.selectedPlan === 'MONTHLY' ? '$3.990 CLP / Mes' : '$34.990 CLP / Año'}
                  </span>
                </div>
                <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-1 rounded-lg">
                  {selectedRequest.selectedPlan === 'MONTHLY' ? 'Arriendo Mensual' : 'Promoción Anual'}
                </span>
              </div>

              {/* Data overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Solicitante:</span>
                  <strong className="text-slate-900">{selectedRequest.fullName}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Correo (Login):</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedRequest.email}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Teléfono / WhatsApp:</span>
                  <span className="font-mono text-slate-800">{selectedRequest.phone || 'No especificado'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Colegio / Institución:</span>
                  <span className="text-slate-800 font-semibold">{selectedRequest.institutionName || 'Sin especificar'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Curso / Nivel:</span>
                  <span className="text-slate-800 font-semibold">{selectedRequest.courseName || 'Sin especificar'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Plan Seleccionado:</span>
                  <span className="text-orange-700 font-bold">
                    {selectedRequest.selectedPlan === 'MONTHLY' ? 'Arriendo Mensual $3.990 CLP' : 'Promoción Anual $34.990 CLP'}
                  </span>
                </div>
                {selectedRequest.message && (
                  <div>
                    <span className="text-slate-500 block mb-1">Mensaje / Notas del solicitante:</span>
                    <p className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 italic">
                      "{selectedRequest.message}"
                    </p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Derivado internamente a:</span>
                  <span className="font-mono text-blue-700 font-bold">jorgetoroduran@gmail.com</span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Acción de Estado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateAccessRequestStatus(selectedRequest.id, 'PENDING');
                      setSelectedRequest({ ...selectedRequest, status: 'PENDING' });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                      selectedRequest.status === 'PENDING'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Marcar Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateAccessRequestStatus(selectedRequest.id, 'APPROVED', 'Cobro recibido y cuenta habilitada');
                      setSelectedRequest({ ...selectedRequest, status: 'APPROVED' });

                      // Auto-create user account if not existing
                      const exists = userAccounts.some((u) => u.email.toLowerCase() === selectedRequest.email.toLowerCase());
                      if (!exists) {
                        addUserAccount({
                          name: selectedRequest.fullName,
                          email: selectedRequest.email,
                          password: '123',
                          role: 'TESORERO_CURSO',
                          rut: selectedRequest.rut || '15.000.000-K',
                        });
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                      selectedRequest.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Aprobar & Activar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateAccessRequestStatus(selectedRequest.id, 'REJECTED');
                      setSelectedRequest({ ...selectedRequest, status: 'REJECTED' });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                      selectedRequest.status === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rechazar
                  </button>
                </div>
              </div>

              {/* Direct Mail to Applicant */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={`mailto:${selectedRequest.email}?subject=${encodeURIComponent('Activación de Cuenta Cuotin Escolar')}&body=${encodeURIComponent(`Hola ${selectedRequest.fullName},\n\nTe escribo respecto a tu solicitud de acceso para el curso ${selectedRequest.courseName || ''} de Cuotin Escolar (${selectedRequest.selectedPlan === 'MONTHLY' ? '$3.990 CLP/Mes' : '$34.990 CLP/Año'})...`)}`}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contactar al Solicitante por Email</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institution Modal */}
      {showInstModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {instToEdit ? 'Editar Institución' : 'Crear Nueva Institución / Colegio'}
              </h3>
              <button
                onClick={() => setShowInstModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInstitution} className="p-5 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Institución / Colegio *
                </label>
                <input
                  id="input-inst-name"
                  type="text"
                  required
                  placeholder="Ej. Colegio San Agustín"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ciudad / Comuna *
                  </label>
                  <input
                    id="input-inst-city"
                    type="text"
                    required
                    placeholder="Santiago"
                    value={instCity}
                    onChange={(e) => setInstCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono Contacto
                  </label>
                  <input
                    id="input-inst-phone"
                    type="text"
                    placeholder="+56 9 8765 4321"
                    value={instPhone}
                    onChange={(e) => setInstPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección
                </label>
                <input
                  id="input-inst-address"
                  type="text"
                  placeholder="Av. Principal 1234"
                  value={instAddress}
                  onChange={(e) => setInstAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email de Contacto
                </label>
                <input
                  id="input-inst-email"
                  type="email"
                  placeholder="contacto@colegio.cl"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInstModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-institution"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {instToEdit ? 'Guardar Cambios' : 'Crear Institución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {courseToEdit ? 'Editar Curso' : 'Crear Nuevo Curso'}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-5 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institución Perteneciente *
                </label>
                <select
                  id="select-course-institution"
                  value={courseInstId}
                  onChange={(e) => setCourseInstId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Curso *
                </label>
                <input
                  id="input-course-name"
                  type="text"
                  required
                  placeholder="Ej. 4° Básico A, 8° Básico B, 2° Medio C..."
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Año Escolar *
                  </label>
                  <input
                    id="input-course-year"
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    value={courseYear}
                    onChange={(e) => setCourseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Cuota Mensual ($ CLP) *
                  </label>
                  <input
                    id="input-course-fee"
                    type="number"
                    required
                    min="500"
                    step="500"
                    value={courseFee}
                    onChange={(e) => setCourseFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción u Objetivos del Curso
                </label>
                <input
                  id="input-course-desc"
                  type="text"
                  placeholder="Ej. Fondo para actividades anuales, día del profesor y graduación"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-course"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {courseToEdit ? 'Guardar Cambios' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Treasurer Modal */}
      {showTreasurerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                Asignar Apoderado Tesorero / Administrador
              </h3>
              <button
                onClick={() => setShowTreasurerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreasurer} className="p-5 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curso Asignado
                </label>
                <select
                  id="select-treasurer-course"
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {courses.map((c) => {
                    const inst = institutions.find((i) => i.id === c.institutionId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} — {inst?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo del Apoderado Tesorero *
                </label>
                <input
                  id="input-treasurer-name"
                  type="text"
                  required
                  placeholder="Ej. Carolina Herrera Fuenzalida"
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RUT *
                  </label>
                  <input
                    id="input-treasurer-rut"
                    type="text"
                    required
                    placeholder="15.432.198-7"
                    value={treasurerRut}
                    onChange={(e) => setTreasurerRut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    id="input-treasurer-phone"
                    type="text"
                    required
                    placeholder="+56 9 9876 5432"
                    value={treasurerPhone}
                    onChange={(e) => setTreasurerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  id="input-treasurer-email"
                  type="email"
                  required
                  placeholder="carolina.herrera@gmail.com"
                  value={treasurerEmail}
                  onChange={(e) => setTreasurerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Initial Startup Password */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Contraseña de Inicio Provisoria
                    </span>
                    <span className="text-[10px] text-slate-500">
                      El tesorero deberá generar su nueva clave definitiva al iniciar sesión por primera vez.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTreasurerInitialPass(
                        Math.floor(100000 + Math.random() * 900000).toString()
                      )
                    }
                    className="text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    Generar Otra
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="input-treasurer-initial-pass"
                    type="text"
                    required
                    value={treasurerInitialPass}
                    onChange={(e) => setTreasurerInitialPass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 text-center tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(treasurerInitialPass);
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTreasurerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-treasurer"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Guardar y Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {itemToDelete.type === 'institution' && '¿Eliminar Institución / Colegio?'}
                  {itemToDelete.type === 'course' && '¿Eliminar Curso?'}
                  {itemToDelete.type === 'treasurer_course' && '¿Eliminar / Desvincular Tesorero del Curso?'}
                  {itemToDelete.type === 'user_account' && '¿Eliminar Cuenta de Usuario de Tesorería?'}
                  {itemToDelete.type === 'access_request' && '¿Eliminar Solicitud de Acceso?'}
                </h3>

                <div className="text-xs text-slate-600 mt-2 space-y-2">
                  {itemToDelete.type === 'institution' && (
                    <p>
                      Se eliminará el colegio <strong>{itemToDelete.name}</strong> y sus datos asociados.
                    </p>
                  )}
                  {itemToDelete.type === 'course' && (
                    <p>
                      Se eliminará el curso <strong>{itemToDelete.name}</strong>, sus estudiantes y registros asociados.
                    </p>
                  )}
                  {itemToDelete.type === 'access_request' && (
                    <p>
                      Se eliminará la solicitud de acceso de <strong>{itemToDelete.name}</strong> (<em>{itemToDelete.email}</em>).
                    </p>
                  )}
                  {itemToDelete.type === 'treasurer_course' && (
                    <div>
                      <p>
                        Se desvinculará a <strong>{itemToDelete.name}</strong> como apoderado/a tesorero del curso{' '}
                        <strong>{itemToDelete.courseName}</strong>.
                      </p>
                      {itemToDelete.email && (
                        <p className="mt-1 text-slate-500">
                          Se revocará la cuenta de acceso vinculada a <em>{itemToDelete.email}</em>.
                        </p>
                      )}
                    </div>
                  )}
                  {itemToDelete.type === 'user_account' && (
                    <div>
                      <p>
                        Se eliminará permanentemente la cuenta de usuario de <strong>{itemToDelete.name}</strong> (
                        <em>{itemToDelete.email}</em>).
                      </p>
                      <p className="mt-1 text-rose-600 font-medium">
                        El usuario ya no podrá ingresar a la plataforma ni administrar cuotas.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setItemToDelete(null)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-delete-admin-item"
                    type="button"
                    onClick={confirmDelete}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
