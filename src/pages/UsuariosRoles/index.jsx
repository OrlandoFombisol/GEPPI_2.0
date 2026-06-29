import { useState, useEffect } from 'react'
import { UserCheck, UserX, Plus, Pencil, Shield, Key, Eye, EyeOff } from 'lucide-react'
import { usuarioDB } from '@/db'
import { ROL, ROL_LABEL, ROL_CLASES } from '@/constants'
import { Badge, Button, Card, Modal } from '@/components/ui'
import { useUser } from '@/contexts/UserContext'

// ─── Modal crear / editar usuario ────────────────────────────────────────────

const ROLES_OPCIONES = [
  { value: ROL.ADMINISTRADOR, label: ROL_LABEL.ADMINISTRADOR },
  { value: ROL.SST,           label: ROL_LABEL.SST           },
  { value: ROL.ALMACEN,       label: ROL_LABEL.ALMACEN       },
  { value: ROL.SUPERVISOR,    label: ROL_LABEL.SUPERVISOR     },
]

function ModalUsuario({ usuario, onSave, onClose, saving }) {
  const isEdit = Boolean(usuario?.id)
  const [form, setForm] = useState({
    nombre:   usuario?.nombre   || '',
    correo:   usuario?.correo   || '',
    password: '',
    rol:      usuario?.rol      || ROL.COLABORADOR,
    estado:   usuario?.estado   || 'ACTIVO',
  })
  const [showPass, setShowPass] = useState(false)
  const [errors,   setErrors]   = useState({})

  function validar() {
    const e = {}
    if (!form.nombre.trim())  e.nombre  = 'Nombre requerido'
    if (!form.correo.trim())  e.correo  = 'Correo requerido'
    if (!isEdit && !form.password.trim()) e.password = 'Contraseña requerida'
    if (form.password && form.password.length < 4) e.password = 'Mínimo 4 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) return
    const data = { ...form }
    if (isEdit && !data.password) delete data.password
    onSave(data)
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500'
  const select = 'w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white'

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar usuario` : 'Nuevo usuario'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="user-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Nombre completo</label>
          <input className={input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre y apellido" />
          {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Correo electrónico</label>
          <input className={input} type="email" value={form.correo}
            onChange={e => setForm(f => ({ ...f, correo: e.target.value.toLowerCase() }))}
            placeholder="usuario@empresa.co"
            disabled={isEdit}
          />
          {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">
            {isEdit ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
          </label>
          <div className="relative">
            <input
              className={input + ' pr-10'}
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? '••••••••' : 'Contraseña de acceso'}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Rol</label>
          <select className={select} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
            {ROLES_OPCIONES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Estado</label>
            <select className={select} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  )
}

// ─── Fila de usuario ──────────────────────────────────────────────────────────

function FilaUsuario({ u, onEdit, onToggle, currentUserId }) {
  const esYo = u.id === currentUserId
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">
          {(u.nombre || u.correo || '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '??'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 text-sm truncate">{u.nombre}</p>
          {esYo && <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-semibold">Tú</span>}
        </div>
        <p className="text-xs text-slate-500 truncate">{u.correo}</p>
        {u.ultimoAcceso && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            Último acceso: {new Date(u.ultimoAcceso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Rol */}
      <div className="flex-shrink-0">
        <span className={['text-xs font-semibold px-2.5 py-1 rounded-full', ROL_CLASES[u.rol] || 'bg-slate-100 text-slate-600'].join(' ')}>
          {ROL_LABEL[u.rol] || u.rol}
        </span>
      </div>

      {/* Estado */}
      <div className="flex-shrink-0">
        <Badge variant={u.estado === 'ACTIVO' ? 'success' : 'neutral'}>
          {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(u)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          title="Editar"
        >
          <Pencil size={15} />
        </button>
        {!esYo && (
          <button
            onClick={() => onToggle(u)}
            className={[
              'p-1.5 rounded-lg transition-colors',
              u.estado === 'ACTIVO'
                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                : 'text-slate-400 hover:text-green-600 hover:bg-green-50',
            ].join(' ')}
            title={u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
          >
            {u.estado === 'ACTIVO' ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function UsuariosRoles() {
  const { user: currentUser } = useUser()
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState(null)   // null | {} | usuario

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await usuarioDB.getAll()
      setUsuarios(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data) {
    setSaving(true)
    try {
      if (modal?.id) {
        const update = { ...data }
        if (!update.password) delete update.password
        await usuarioDB.update(modal.id, update)
      } else {
        await usuarioDB.create(data)
      }
      setModal(null)
      await cargar()
    } catch (e) {
      alert(e?.message?.includes('already exists')
        ? 'Ya existe un usuario con ese correo.'
        : 'Error al guardar usuario.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(u) {
    await usuarioDB.update(u.id, { estado: u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' })
    await cargar()
  }

  const activos   = usuarios.filter(u => u.estado === 'ACTIVO').length
  const inactivos = usuarios.filter(u => u.estado === 'INACTIVO').length

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield size={24} className="text-primary-700" />
            Usuarios y Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona quién puede acceder al sistema y con qué permisos.
          </p>
        </div>
        <Button onClick={() => setModal({})} className="flex items-center gap-2">
          <Plus size={16} /> Nuevo usuario
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total usuarios', value: usuarios.length, color: 'text-slate-700' },
          { label: 'Activos',        value: activos,          color: 'text-green-700'  },
          { label: 'Inactivos',      value: inactivos,        color: 'text-red-600'    },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={['text-3xl font-bold', s.color].join(' ')}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Info roles */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key size={15} className="text-primary-700" />
          <p className="text-sm font-semibold text-slate-700">Descripción de roles</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { rol: 'ADMINISTRADOR', desc: 'Acceso completo. Puede gestionar usuarios, configurar y eliminar datos.' },
            { rol: 'SST',           desc: 'Profesional SST. Acceso a módulos SST, EPP, alertas y reportes.' },
            { rol: 'ALMACEN',       desc: 'Gestiona inventario, entregas y recepción de EPP.' },
            { rol: 'SUPERVISOR',    desc: 'Consulta trabajadores, historial y reportes. Solo lectura en EPP.' },
          ].map(r => (
            <div key={r.rol} className="flex gap-2 items-start p-2.5 rounded-lg bg-slate-50">
              <span className={['text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5', ROL_CLASES[r.rol] || ''].join(' ')}>
                {ROL_LABEL[r.rol] || r.rol}
              </span>
              <p className="text-xs text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Lista de usuarios */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Usuarios del sistema ({usuarios.length})</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Cargando usuarios…</div>
        ) : usuarios.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No hay usuarios registrados.</div>
        ) : (
          usuarios.map(u => (
            <FilaUsuario
              key={u.id}
              u={u}
              onEdit={setModal}
              onToggle={handleToggle}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </Card>

      {/* Modal */}
      {modal !== null && (
        <ModalUsuario
          usuario={modal?.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
