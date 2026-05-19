import React, { useState, useEffect } from "react";
import styles from "./ManageUsers.module.css";
import { API_BASE_URL } from "../../config";

const ROLES = ["Researcher", "Reviewer", "TRB", "Admin"];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  role_name: "Researcher",
  department: "",
};

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null });
  const [noticeModal, setNoticeModal] = useState({ show: false, message: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users", data);
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setIsEditMode(false);
    setSelectedUser(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_name: user.role_name,
      department: user.department,
    });
    setIsEditMode(true);
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.first_name?.trim()) { setNoticeModal({ show: true, message: "First name is required." }); return; }
    if (!form.last_name?.trim()) { setNoticeModal({ show: true, message: "Last name is required." }); return; }
    if (!form.email?.trim()) { setNoticeModal({ show: true, message: "Email is required." }); return; }

    const token = localStorage.getItem("token");
    if (isEditMode) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            role_name: form.role_name,
            department: form.department,
          }),
        });

        if (response.ok) {
          await fetchUsers();
          setNoticeModal({ show: true, message: "User updated successfully." });
          closeModal();
        } else {
          const data = await response.json().catch(() => ({}));
          setNoticeModal({ show: true, message: data.error || "Failed to update user." });
        }
      } catch (err) {
        console.error("Error updating user", err);
        setNoticeModal({ show: true, message: "Server error." });
      }
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            role_name: form.role_name,
            department: form.department,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          await fetchUsers();
          setNoticeModal({
            show: true,
            message: data.message || "User created successfully.",
          });
          closeModal();
        } else {
          setNoticeModal({ show: true, message: data.error || "Failed to create user." });
        }
      } catch (err) {
        console.error("Error creating user", err);
        setNoticeModal({ show: true, message: "Server error." });
      }
    }
  };

  const handleDelete = (userId) => {
    setConfirmModal({ show: true, userId });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/users/${confirmModal.userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchUsers();
        setNoticeModal({ show: true, message: "User successfully deleted." });
      } else {
        setNoticeModal({ show: true, message: "Failed to delete user." });
      }
    } catch (err) {
      console.error("Error deleting user", err);
      setNoticeModal({ show: true, message: "Server error." });
    }
    setConfirmModal({ show: false, userId: null });
  };

  const filtered = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchSearch =
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>MANAGE USERS</h2>
        <button className={styles.createBtn} onClick={openCreate}>+ Add User</button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchWrapper}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.roleDropdown}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r === "TRB" ? "TRB Chair" : r}</option>
          ))}
        </select>
      </div>

      <div className={styles.list}>
        {filtered.length > 0 ? filtered.map((user) => (
          <div key={user.id} className={styles.userCard}>
            <div className={styles.userAvatar}>
              {(user.first_name || " ").charAt(0)}{(user.last_name || " ").charAt(0)}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.first_name} {user.last_name}</span>
              <span className={styles.userEmail}>{user.email}</span>
              <span className={styles.userDept}>{user.department || "No department"}</span>
            </div>
            <div className={styles.userRole}>
              <span className={styles.roleChip}>{user.role_name === "TRB" ? "TRB Chair" : (user.role_name && user.role_name !== "None" ? user.role_name : "No Role")}</span>
            </div>
            <div className={styles.userActions}>
              <button className={styles.editBtn} onClick={() => openEdit(user)}>
                <i className="bi bi-pencil"></i>
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        )) : (
          <p className={styles.empty}>No users found.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{isEditMode ? "Edit User" : "Add User"}</h3>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>First Name *</label>
                <input
                  className={styles.input}
                  value={form.first_name || ""}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label>Last Name *</label>
                <input
                  className={styles.input}
                  value={form.last_name || ""}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label>Email *</label>
                <input
                  className={styles.input}
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  readOnly={isEditMode}
                  style={isEditMode ? { backgroundColor: '#f0f0f0', color: '#666' } : {}}
                />
              </div>
              <div className={styles.formField}>
                <label>Role *</label>
                <select
                  className={styles.input}
                  value={form.role_name}
                  onChange={(e) => setForm({ ...form, role_name: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r === "TRB" ? "TRB Chair" : r}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.formField} ${styles.fullWidth}`}>
                <label>Department</label>
                <input
                  className={styles.input}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleSave}>
                {isEditMode ? "Save Changes" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete User?</h3>
            <p>This action cannot be undone. Are you sure?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmModal({ show: false, userId: null })}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {noticeModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Notice</h3>
            <p>{noticeModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.confirmBtn} onClick={() => setNoticeModal({ show: false, message: "" })}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;