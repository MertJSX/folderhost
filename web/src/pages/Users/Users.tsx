import { useCallback, useEffect, useState } from "react"
import axiosInstance from "../../utils/axiosInstance"
import MessageBox from "../../components/minimal/MessageBox/MessageBox";
import LoadingComponent from "../../components/LoadingComponent/LoadingComponent";
import type { Account } from "../../types/Account";
import { FaUserFriends, FaUserPlus, FaUser, FaEnvelope, FaSearch, FaUsers } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { IoTelescopeSharp } from "react-icons/io5";

const Users: React.FC = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<Array<Account>>([]);
  const [filteredUsers, setFilteredUsers] = useState<Array<Account>>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    document.title = "Users - folderhost"
    getUsersData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const getUsersData = useCallback(() => {
    setUsers([])
    setIsLoading(true)
    axiosInstance.get(`/users`).then((data) => {
      setIsLoading(false)
      if (!data.data.users || data.data.users.length === 0) {
        setUsers([])
        setFilteredUsers([])
        return
      }
      setUsers(data.data.users)
      setFilteredUsers(data.data.users)
    }).catch((error) => {
      setIsLoading(false)
      setIsError(true)
      if (error.response.data.err) {
        setMessage(error.response.data.err)
        return
      }
      setMessage("Unknown error while trying to load users.")
    })
  }, [])

  return (
    <div>
      {/* <Header /> */}
      <MessageBox message={message} isErr={isError} setMessage={setMessage} />
      <main className="mt-10">
        <div className="flex flex-col items-center">
          {/* Main Container */}
          <section className="flex flex-col bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl min-h-[700px] h-auto p-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 2xl:p-3 bg-sky-500 rounded-lg">
                  <FaUserFriends size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl 2xl:text-2xl font-bold text-white">Users</h1>
                  <p className="text-sm 2xl:text-base text-gray-400">Manage system users</p>
                </div>
              </div>

              <Link
                to="/users/new"
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 min-w-[140px] justify-center"
              >
                <FaUserPlus size={18} />
                Add User
              </Link>
            </div>

            {/* Stats and Search Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-2 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <FaUsers className="text-sky-400" />
                  <span className="font-semibold">Total Users:</span>
                  <span className="text-white">{users.length}</span>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <hr className="border-gray-600 mb-6" />

            {/* Users List */}
            <section className="flex-1 overflow-hidden">
              {/* Users List Content */}
              <div className="overflow-y-auto max-h-[500px] rounded-lg">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <article
                      onClick={() => navigate(`/users/${user.username}`)}
                      key={user.username}
                      className="flex items-center p-4 bg-gray-700 border border-gray-700 hover:border-sky-300 cursor-pointer transition-all duration-200 hover:bg-gray-600 group mb-2 rounded-lg"
                    >
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0 mr-4">
                        <div className="p-3 bg-sky-500 rounded-full group-hover:bg-sky-500 transition-colors">
                          <FaUser className="text-white" />
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 mb-2 sm:mb-0">
                            <div className="text-lg font-semibold text-cyan-200 group-hover:text-cyan-100 transition-colors">
                              {user.username}
                            </div>
                            {
                              user.scope ?
                                <div className="flex items-center gap-2 text-gray-300 mt-1">
                                  <IoTelescopeSharp className="text-gray-400 text-sm" />
                                  <span className="text-sm break-words">{user.scope}</span>
                                </div> : null
                            }
                            {
                              user.email ?
                                <div className="flex items-center gap-2 text-gray-300 mt-1">
                                  <FaEnvelope className="text-gray-400 text-sm" />
                                  <span className="text-sm break-words">{user.email}</span>
                                </div> : null
                            }
                          </div>

                          {/* Arrow Indicator */}
                          <div className="text-gray-400 group-hover:text-sky-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : !isLoading && (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FaUsers size={64} className="mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">
                      {searchTerm ? "No users found" : "No users available"}
                    </h2>
                    <p className="text-center max-w-md">
                      {searchTerm
                        ? "Try adjusting your search terms to find what you're looking for."
                        : "You don't have permission to access users."
                      }
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex justify-center items-center py-16">
                    <LoadingComponent />
                  </div>
                )}
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Users