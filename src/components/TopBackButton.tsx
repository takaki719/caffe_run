import React from "react";
import Link from "next/link";
import Image from "next/image";

const TopBackButton: React.FC = () => (
  <div className="w-full flex items-center justify-between px-4 py-3">
    <Link href="../" className="flex items-center">
      <Image
        src="/icons/logo.png"
        alt="Caffe-Run Logo"
        width={150}
        height={50}
        className="h-10 w-auto cursor-pointer"
      />
    </Link>
  </div>
);

export default TopBackButton;
