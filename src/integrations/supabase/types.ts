export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      buddy_conversations: {
        Row: {
          context: NonNullable<Json>
          created_at: string
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          context?: NonNullable<Json>
          created_at?: string
          id?: string
          teacher_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          context?: NonNullable<Json>
          created_at?: string
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      buddy_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "buddy_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_student_seats: {
        Row: {
          course_id: string
          id: string
          seat_col: number
          seat_row: number
          student_id: string
        }
        Insert: {
          course_id: string
          id?: string
          seat_col: number
          seat_row: number
          student_id: string
        }
        Update: {
          course_id?: string
          id?: string
          seat_col?: number
          seat_row?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_student_seats_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_student_seats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          period: string | null
          school_year: string | null
          source_text: string | null
          subject_id: string
          teacher_id: string
          thematic_plan_file_name: string | null
          thematic_plan_file_url: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
          period?: string | null
          school_year?: string | null
          source_text?: string | null
          subject_id: string
          teacher_id: string
          thematic_plan_file_name?: string | null
          thematic_plan_file_url?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          period?: string | null
          school_year?: string | null
          source_text?: string | null
          subject_id?: string
          teacher_id?: string
          thematic_plan_file_name?: string | null
          thematic_plan_file_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      criterion_assessments: {
        Row: {
          assessed_at: string
          confirmed_by_teacher: boolean
          created_at: string
          criterion_id: string
          exit_ticket_id: string | null
          id: string
          lesson_id: string | null
          level: string
          note: string
          proof_id: string | null
          source: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          assessed_at?: string
          confirmed_by_teacher?: boolean
          created_at?: string
          criterion_id: string
          exit_ticket_id?: string | null
          id?: string
          lesson_id?: string | null
          level: string
          note?: string
          proof_id?: string | null
          source: string
          student_id: string
          teacher_id: string
        }
        Update: {
          assessed_at?: string
          confirmed_by_teacher?: boolean
          created_at?: string
          criterion_id?: string
          exit_ticket_id?: string | null
          id?: string
          lesson_id?: string | null
          level?: string
          note?: string
          proof_id?: string | null
          source?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "criterion_assessments_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_exit_ticket_id_fkey"
            columns: ["exit_ticket_id"]
            isOneToOne: false
            referencedRelation: "exit_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_goals: {
        Row: {
          class_id: string
          course_id: string | null
          created_at: string
          description: string
          id: string
          pupil_text: string
          subject_id: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          course_id?: string | null
          created_at?: string
          description?: string
          id?: string
          pupil_text?: string
          subject_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          course_id?: string | null
          created_at?: string
          description?: string
          id?: string
          pupil_text?: string
          subject_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_goals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_goals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          created_at: string
          description: string
          goal_id: string
          id: string
          level_descriptors: NonNullable<Json>
          position: number | null
          pupil_text: string | null
          scale: Json | null
          sort_order: number
          svp_variants: NonNullable<Json>
          teacher_text: string | null
        }
        Insert: {
          created_at?: string
          description: string
          goal_id: string
          id?: string
          level_descriptors?: NonNullable<Json>
          position?: number | null
          pupil_text?: string | null
          scale?: Json | null
          sort_order?: number
          svp_variants?: NonNullable<Json>
          teacher_text?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          goal_id?: string
          id?: string
          level_descriptors?: NonNullable<Json>
          position?: number | null
          pupil_text?: string | null
          scale?: Json | null
          sort_order?: number
          svp_variants?: NonNullable<Json>
          teacher_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "educational_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_groups: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          id: string
          mode: string | null
          name: string
          settings: NonNullable<Json>
          subject_id: string | null
          teacher_id: string
          type: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          mode?: string | null
          name: string
          settings?: NonNullable<Json>
          subject_id?: string | null
          teacher_id: string
          type: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          mode?: string | null
          name?: string
          settings?: NonNullable<Json>
          subject_id?: string | null
          teacher_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_groups_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          approved_at: string | null
          created_at: string
          goal_id: string | null
          group_id: string | null
          id: string
          period: string
          recommendations_outside: NonNullable<Json>
          review: Json | null
          sentences: NonNullable<Json>
          source_proof_ids: Json | null
          status: string
          student_id: string
          subject: string
          teacher_id: string
          text: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          goal_id?: string | null
          group_id?: string | null
          id?: string
          period: string
          recommendations_outside?: NonNullable<Json>
          review?: Json | null
          sentences?: NonNullable<Json>
          source_proof_ids?: Json | null
          status?: string
          student_id: string
          subject: string
          teacher_id: string
          text?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          goal_id?: string | null
          group_id?: string | null
          id?: string
          period?: string
          recommendations_outside?: NonNullable<Json>
          review?: Json | null
          sentences?: NonNullable<Json>
          source_proof_ids?: Json | null
          status?: string
          student_id?: string
          subject?: string
          teacher_id?: string
          text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "educational_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "evaluation_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_tickets: {
        Row: {
          confirmed_by_teacher: boolean
          created_at: string
          id: string
          lesson_id: string
          proof_id: string | null
          pupil_comment: string
          source: string
          student_id: string
          submitted_at: string
          teacher_comment: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          confirmed_by_teacher?: boolean
          created_at?: string
          id?: string
          lesson_id: string
          proof_id?: string | null
          pupil_comment?: string
          source: string
          student_id: string
          submitted_at?: string
          teacher_comment?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          confirmed_by_teacher?: boolean
          created_at?: string
          id?: string
          lesson_id?: string
          proof_id?: string | null
          pupil_comment?: string
          source?: string
          student_id?: string
          submitted_at?: string
          teacher_comment?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_tickets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_tickets_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_goals: {
        Row: {
          goal_id: string
          lesson_id: string
        }
        Insert: {
          goal_id: string
          lesson_id: string
        }
        Update: {
          goal_id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "educational_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_goals_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          date: string | null
          description: string
          hours: number | null
          id: string
          materials: NonNullable<Json>
          month: string | null
          observation_focus: string
          planned_activities: string
          position: number | null
          rvp_outcome: string | null
          status: string
          subject_id: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          date?: string | null
          description?: string
          hours?: number | null
          id?: string
          materials?: NonNullable<Json>
          month?: string | null
          observation_focus?: string
          planned_activities?: string
          position?: number | null
          rvp_outcome?: string | null
          status?: string
          subject_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          date?: string | null
          description?: string
          hours?: number | null
          id?: string
          materials?: NonNullable<Json>
          month?: string | null
          observation_focus?: string
          planned_activities?: string
          position?: number | null
          rvp_outcome?: string | null
          status?: string
          subject_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proof_goals: {
        Row: {
          goal_id: string
          proof_id: string
        }
        Insert: {
          goal_id: string
          proof_id: string
        }
        Update: {
          goal_id?: string
          proof_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "educational_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_goals_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_skills: {
        Row: {
          proof_id: string
          skill_id: string
        }
        Insert: {
          proof_id: string
          skill_id: string
        }
        Update: {
          proof_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_skills_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_students: {
        Row: {
          id: string
          proof_id: string
          student_id: string
        }
        Insert: {
          id?: string
          proof_id: string
          student_id: string
        }
        Update: {
          id?: string
          proof_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_students_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_types: {
        Row: {
          color: string
          created_at: string
          description: string
          fields: string[]
          icon: string
          id: string
          name: string
          sort_order: number
          teacher_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          fields?: string[]
          icon?: string
          id?: string
          name: string
          sort_order?: number
          teacher_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          fields?: string[]
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proofs_of_learning: {
        Row: {
          created_at: string
          date: string
          file_name: string | null
          file_url: string | null
          id: string
          lesson_id: string | null
          note: string | null
          proof_type_id: string | null
          teacher_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          lesson_id?: string | null
          note?: string | null
          proof_type_id?: string | null
          teacher_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          lesson_id?: string | null
          note?: string | null
          proof_type_id?: string | null
          teacher_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofs_of_learning_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_of_learning_proof_type_id_fkey"
            columns: ["proof_type_id"]
            isOneToOne: false
            referencedRelation: "proof_types"
            referencedColumns: ["id"]
          },
        ]
      }
      self_assessment_sessions: {
        Row: {
          closed_at: string | null
          created_at: string
          expires_at: string
          id: string
          lesson_id: string
          teacher_id: string
          token: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          lesson_id: string
          teacher_id: string
          token?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          lesson_id?: string
          teacher_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_assessment_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      student_goal_levels: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          level: string
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          level: string
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          level?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_goal_levels_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "educational_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_goal_levels_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_group_members: {
        Row: {
          group_id: string
          id: string
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          class_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          teacher_id: string
        }
        Insert: {
          class_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          teacher_id: string
        }
        Update: {
          class_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          communication_preferences: string
          created_at: string
          first_name: string
          id: string
          interests: string
          last_name: string
          learning_styles: string
          nickname: string
          notes: string
          svp: boolean
          svp_details: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          communication_preferences?: string
          created_at?: string
          first_name: string
          id?: string
          interests?: string
          last_name: string
          learning_styles?: string
          nickname?: string
          notes?: string
          svp?: boolean
          svp_details?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          communication_preferences?: string
          created_at?: string
          first_name?: string
          id?: string
          interests?: string
          last_name?: string
          learning_styles?: string
          nickname?: string
          notes?: string
          svp?: boolean
          svp_details?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_criterion_levels: {
        Row: {
          assessed_at: string | null
          confirmed_by_teacher: boolean | null
          criterion_id: string | null
          exit_ticket_id: string | null
          id: string | null
          lesson_id: string | null
          level: string | null
          proof_id: string | null
          source: string | null
          student_id: string | null
          teacher_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criterion_assessments_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_exit_ticket_id_fkey"
            columns: ["exit_ticket_id"]
            isOneToOne: false
            referencedRelation: "exit_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs_of_learning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_student_nickname: {
        Args: { p_teacher_id: string }
        Returns: string
      }
      goal_level_names: { Args: { p_goal_id: string }; Returns: string[] }
      legacy_level_to_jctu: {
        Args: { p_level: string; p_levels: string[] }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
