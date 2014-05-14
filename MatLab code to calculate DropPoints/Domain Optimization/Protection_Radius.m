clear all
clc

% M=1e-12; %g/s
% D=1e-6;  %m^2/s
% C=1e-9;  %g/m^3

M=3.7*10^-8;
D=1.11*10^-6;
C=1e-3;

t=(0:60*60:60*60*24*60);
r=zeros(length(t),1);
n=zeros(length(t),1);



for i=2:length(t)
    aux=1;
    s=0;
    while aux-r(i)>1e-2
        r(i)=M/(2*pi*D*C)*erfc(aux/(2*sqrt(D*t(i))));
        aux=r(i);

        s=s+1;
        if s==100
            break
        end
    end
    n(i)=s;
end

plot(t/3600/24,r)