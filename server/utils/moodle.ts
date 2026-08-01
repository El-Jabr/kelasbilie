import { prisma } from './db'

export interface MoodleCategory {
  id: number
  name: string
  parent: number
  depth: number
}

export interface MoodleCourse {
  id: number
  shortname: string
  fullname: string
  categoryid: number
  visible: number // 1 or 0
}

export interface MoodleUser {
  id: number
  username: string
  firstname: string
  lastname: string
  email: string
  idnumber?: string
}

export interface MoodleGradeItem {
  id: number
  itemname: string | null
  itemtype: string
  itemmodule: string | null
  grademin: number
  grademax: number
  graderaw?: number | null
}

export interface MoodleUserGrade {
  courseid: number
  userid: number
  userfullname: string
  gradeitems: MoodleGradeItem[]
}

export interface MoodleCreateUserParam {
  username: string
  password?: string
  firstname: string
  lastname: string
  email: string
  auth?: string
  idnumber?: string
}

export interface MoodleEnrolParam {
  roleid: number // 3 = editingteacher, 4 = teacher, 5 = student
  userid: number // Moodle User ID
  courseid: number // Moodle Course ID
}

function makeError(opts: { statusCode: number; statusMessage: string }) {
  if (typeof createError === 'function') {
    return createError(opts)
  }
  const err = new Error(opts.statusMessage) as any
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
}

async function doFetch<T>(url: string): Promise<T> {
  if (typeof $fetch === 'function') {
    const res = await $fetch(url, { method: 'GET' })
    return res as unknown as T
  }
  const res = await fetch(url)
  return (await res.json()) as T
}

/**
 * Service Wrapper untuk interaksi dengan Moodle REST API
 */
export class MoodleService {
  /**
   * Mengambil konfigurasi URL & Token Moodle dari database.
   */
  private static async getConfig() {
    const setting = await prisma.schoolSetting.findFirst()
    if (!setting || !setting.moodleUrl || !setting.moodleToken) {
      throw makeError({
        statusCode: 400,
        statusMessage: 'URL dan Token Moodle belum dikonfigurasi di Pengaturan Sekolah.'
      })
    }
    const baseUrl = setting.moodleUrl.replace(/\/+$/, '')
    return {
      baseUrl: `${baseUrl}/webservice/rest/server.php`,
      token: setting.moodleToken
    }
  }

  /**
   * Helper untuk mengonversi object/array JavaScript ke format URLParams yang dikenali Moodle API
   */
  private static buildMoodleParams(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {}
    if (obj === null || obj === undefined) return result

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        const propName = prefix ? `${prefix}[${key}]` : key
        Object.assign(result, this.buildMoodleParams(obj[key], propName))
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const propName = `${prefix}[${index}]`
        Object.assign(result, this.buildMoodleParams(item, propName))
      })
    } else {
      result[prefix] = String(obj)
    }

    return result
  }

  /**
   * Helper generik untuk memanggil wsfunction Moodle REST API
   */
  public static async fetch<T>(wsfunction: string, params: Record<string, any> = {}): Promise<T> {
    const { baseUrl, token } = await this.getConfig()

    const queryParams = new URLSearchParams({
      wstoken: token,
      wsfunction: wsfunction,
      moodlewsrestformat: 'json',
      ...params
    })

    try {
      const response = await doFetch<any>(`${baseUrl}?${queryParams.toString()}`)

      // Moodle mereturn object exception jika token/fungsi/parameter salah
      if (response && response.exception) {
        throw makeError({
          statusCode: 400,
          statusMessage: `Moodle API Error [${response.errorcode}]: ${response.message}`
        })
      }

      return response as T
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error(`Moodle Fetch Error (${wsfunction}):`, error)
      throw makeError({
        statusCode: 502,
        statusMessage: `Gagal terhubung ke Moodle API (${wsfunction}): ${error.message}`
      })
    }
  }

  /**
   * Panggilan POST generik dengan perataan parameter objek Moodle
   */
  public static async post<T>(wsfunction: string, data: Record<string, any> = {}): Promise<T> {
    const { baseUrl, token } = await this.getConfig()
    const flattenedParams = this.buildMoodleParams(data)

    const bodyParams = new URLSearchParams({
      wstoken: token,
      wsfunction: wsfunction,
      moodlewsrestformat: 'json',
      ...flattenedParams
    })

    try {
      const response = await $fetch<any>(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      })

      if (response && response.exception) {
        const msg = String(response.message || response.errorcode || '')
        if (msg.includes('Message was not sent') || msg.includes('Message could not be sent')) {
          return { success: true, warning: msg } as unknown as T
        }
        throw makeError({
          statusCode: 400,
          statusMessage: `Moodle API Error [${response.errorcode}]: ${response.message}`
        })
      }

      return response as T
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error(`Moodle POST Error (${wsfunction}):`, error)
      throw makeError({
        statusCode: 502,
        statusMessage: `Gagal terhubung ke Moodle API (${wsfunction}): ${error.message}`
      })
    }
  }

  /**
   * Mengambil semua daftar kategori mata pelajaran dari Moodle
   */
  public static async getCategories(): Promise<MoodleCategory[]> {
    return await this.fetch<MoodleCategory[]>('core_course_get_categories')
  }

  /**
   * Mengambil semua daftar course dari Moodle
   */
  public static async getCourses(): Promise<MoodleCourse[]> {
    return await this.fetch<MoodleCourse[]>('core_course_get_courses')
  }

  /**
   * Mengambil daftar user yang ter-enroll dalam suatu course
   */
  public static async getEnrolledUsers(courseId: number): Promise<MoodleUser[]> {
    return await this.fetch<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId.toString()
    })
  }

  /**
   * Mengambil daftar grade items dan nilai siswa untuk suatu course
   */
  public static async getCourseGradeItems(courseId: number): Promise<{ usergrades: MoodleUserGrade[] }> {
    return await this.fetch<{ usergrades: MoodleUserGrade[] }>('gradereport_user_get_grade_items', {
      courseid: courseId.toString()
    })
  }

  /**
   * Mendaftarkan/membuat user baru di Moodle secara massal (core_user_create_users)
   */
  public static async createUsers(users: MoodleCreateUserParam[]): Promise<{ id: number; username: string }[]> {
    return await this.post<{ id: number; username: string }[]>('core_user_create_users', { users })
  }

  /**
   * Memperbarui user Moodle (core_user_update_users)
   */
  public static async updateUsers(users: { id: number; username?: string; idnumber?: string; password?: string; firstname?: string; lastname?: string; email?: string }[]): Promise<any> {
    return await this.post<any>('core_user_update_users', { users })
  }

  /**
   * Mengambil user Moodle berdasarkan field (core_user_get_users_by_field)
   */
  public static async getUsersByField(field: 'username' | 'email' | 'id' | 'idnumber', values: (string | number)[]): Promise<MoodleUser[]> {
    return await this.post<MoodleUser[]>('core_user_get_users_by_field', { field, values })
  }

  /**
   * Enrolls user ke dalam Course Moodle (enrol_manual_enrol_users)
   */
  public static async enrolUsers(enrolments: MoodleEnrolParam[]): Promise<any> {
    try {
      return await this.post<any>('enrol_manual_enrol_users', { enrolments })
    } catch (err: any) {
      if (err.message && (err.message.includes('Message was not sent') || err.message.includes('Message could not be sent'))) {
        return { success: true, warning: 'Message was not sent' }
      }
      throw err
    }
  }
}
