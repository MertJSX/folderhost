import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {MdRefresh, MdMemory} from "react-icons/md";
import { FaServer, FaClock } from "react-icons/fa";
import { FaScrewdriverWrench } from "react-icons/fa6";
import axiosInstance from '../../utils/axiosInstance';
import MessageBox from "../../components/minimal/MessageBox/MessageBox";
import { type ServiceStatus } from "../../types/ServiceStatus";
import { formatUptime } from "../../utils/formatUptime";
import { getStatusColor, getStatusIcon, formatRam } from "../../utils/serviceUtils";

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    document.title = "Services - folderhost";
    fetchServices();

    const interval = setInterval(fetchServices, 15000);
    const uptimeInterval = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(uptimeInterval);
    }
  }, []);

  const fetchServices = async () => {
    try {
      setRefreshing(true);
      const { data } = await axiosInstance.get("/services");

      if (Array.isArray(data.services)) {
        let newServices: Array<ServiceStatus> = [...data.services]
        newServices = newServices.sort((a, b) => {
          if (a.name < b.name) {
            return -1
          }
          if (a.name > b.name) {
            return 1
          }
          return 0
        })
        setServices([...newServices]);
      }
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.err || "Failed to load services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-900">
      <MessageBox message={error || message} isErr={!!error} setMessage={setError} />

      <main className="mt-10">
        <div className="flex flex-col items-center px-6">
          <section className="flex flex-col bg-gray-800 gap-6 w-4/5 max-w-[1200px] p-6 min-w-[400px] min-h-[600px] shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 2xl:p-3 bg-sky-500 rounded-lg">
                  <FaServer size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl 2xl:text-2xl font-bold text-white">Services</h1>
                  <p className="text-sm 2xl:text-base text-gray-400">Manage your running services</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base text-gray-300">
                  <span className="font-semibold text-white">{services.filter(s => s.status === 'running').length}</span> running,{' '}
                  <span className="font-semibold text-white">{services.length}</span> total
                </span>
                <button
                  onClick={fetchServices}
                  disabled={refreshing}
                  className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-sky-400 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <MdRefresh className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <hr className="border-gray-600" />

            {/* Services Grid */}
            <section className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2">
              {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                  <FaServer size={48} className="mb-4 opacity-50" />
                  <h1 className="text-lg">No Services Configured</h1>
                  <p className="text-sm mt-2">Add services to services.yml to get started</p>
                </div>
              ) : (
                services.map((service, index) => {
                  const statusColor = getStatusColor(service.status);

                  return (
                    <article
                      key={service.name}
                      className="bg-gray-700 rounded-lg border border-gray-600 hover:shadow-xl transition-all"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${statusColor}`}>
                              {getStatusIcon(service.status)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                              <p className="text-sm text-gray-400">Service: {index + 1}</p>
                              {service.pid && (
                                <p className="text-xs text-gray-500 mt-1">PID: {service.pid}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm p-3">
                          <div className="flex items-center gap-2">
                            <MdMemory className="text-gray-400 w-4 h-4" />
                            RAM:
                            <span className="text-gray-300">
                              {formatRam(service)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400 w-4 h-4" />
                            Uptime:
                            {
                              service.status == "running" ?
                                <span className="text-gray-300">{formatUptime(service.start_time ?? "")}</span>
                                : " Not working"
                            }
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {service.ram_bytes && service.ram_usage && (
                          <div className="mt-3">
                            <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 transition-all duration-500"
                                style={{ width: `${(service.ram_usage / service.ram_bytes) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="p-3 bg-gray-800/50 border-t border-gray-600">
                        <button
                          onClick={() => navigate(`/services/${service.name}`)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-sky-400 transition-colors"
                        >
                          <FaScrewdriverWrench className="w-5 h-5" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Services;