/** Type-only DICOMDIR tree contract. */
export interface DicomDirectoryNode {
  id: string
  uid: string
  key: string
  expanded?: boolean
}

export interface DicomDirectoryPatient extends DicomDirectoryNode {
  value: string
  children?: DicomDirectoryStudy[]
}

export interface DicomDirectoryStudy extends DicomDirectoryNode {
  description: string
  numberOfSeries?: number
  numberOfInstances?: number
  value: string
  children?: DicomDirectorySeries[]
}

export interface DicomDirectorySeries extends DicomDirectoryNode {
  description: string
  number: number
  value: string
  children?: DicomDirectoryInstance[]
}

export interface DicomDirectoryInstance extends DicomDirectoryNode {
  number: number
  path: string
  sopClassUID: string
  value: string
}
