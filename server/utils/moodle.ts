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
      throw createError({
        statusCode: 400,
        statusMessage: 'URL dan Token Moodle belum dikonfigurasi di Pengaturan Sekolah.'
      })
    }
    // Hapus trailing slash pada URL jika ada
    const baseUrl = setting.moodleUrl.replace(/\/+$/, '')
    return {
      baseUrl: `${baseUrl}/webservice/rest/server.php`,
      token: setting.moodleToken
    }
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
      const response = await $fetch<any>(`${baseUrl}?${queryParams.toString()}`, {
        method: 'GET'
      })

      // Moodle mereturn object exception jika token/fungsi/parameter salah
      if (response && response.exception) {
        throw createError({
          statusCode: 400,
          statusMessage: `Moodle API Error [${response.errorcode}]: ${response.message}`
        })
      }

      return response as T
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error(`Moodle Fetch Error (${wsfunction}):`, error)
      throw createError({
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
}
